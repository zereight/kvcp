# https://docs.upbit.com/docs/upbit-quotation-websocket

import multiprocessing as mp
import pyupbit
import pandas as pd
import numpy as np
import datetime
import json
from pytz import timezone
from sendMail import send_email
import time
import requests, jwt, uuid

## 인증
f = open("업비트정보.private.json", "r")
api_key = json.load(f)
f.close()
A_key = api_key["accessKey"]  # 본인 access_key 키로 변경
S_key = api_key["secretKey"]  # 본인 secret_key 키로 변경

손절률 = 0.90
손익률 = 1.03

내가_구매했던_가격 = 0
최대수집데이터량 = 10000
급등코인 = ""

제외코인 = ["KRW-BTT", "KRW-XRP"]

def get_price_scale_tick(_price):   
    if _price >= 2000000: 
        return [-3, 1000]
    elif _price >= 1000000: 
        return [-2, 500]
    elif _price >= 500000: 
        return [-2, 100]
    elif _price >= 100000: 
        return [-1, 50]
    elif _price >= 10000: 
        return [-1, 10]
    elif _price >= 1000: 
        return [-1, 5]
    elif _price >= 100: 
        return [0, 1]
    elif _price >= 10: 
        return [1, 0.1]
    elif _price >= 0: 
        return [2, 0.01]

def 시장가매수(market_code):
    print(f'{market_code} 구매')
    ## API로 업비트에서 내 계좌 조회
    my_exchange_account = pd.DataFrame(requests.get("https://api.upbit.com/v1/accounts", headers={"Authorization": 'Bearer {}'.format(jwt.encode({'access_key': A_key,'nonce': str(uuid.uuid4())}, S_key))}).json())
    print(my_exchange_account)
    now_krw = float(my_exchange_account[my_exchange_account['currency'] == 'KRW']['balance'][0])
    # 원화의 50%를 매수, 보유원화의 75%를 넘으면 에러를 뱉는다는 소리가 있음
    order_amount = round(now_krw * 0.5)
    send_email(f'{market_code} 구매', f"9시 펌핑코인 {order_amount}원 시장가 매수")

    buy_market_order_data = pd.DataFrame.from_dict(pyupbit.Upbit(A_key, S_key).buy_market_order(market_code, order_amount), orient='index').T

    return buy_market_order_data

def 지정가매도(market_code, 판매할가격):
    print(f'{market_code} 판매')
    order_quantity = pyupbit.Upbit(A_key, S_key).get_balance(market_code)
    send_email(f'{market_code} 판매', f"9시 펌핑코인 {order_quantity}개 지정가 매도")
    sell_market_order_data = pd.DataFrame.from_dict(
        pyupbit.Upbit(A_key, S_key).sell_limit_order(market_code, 판매할가격 ,order_quantity), orient='index').T

    return sell_market_order_data

## 본 로직
if __name__ == "__main__":
    
    # 로그인테스트, 에러가나면 오류있는거
    if(pyupbit.Upbit(A_key, S_key).get_balance("KRW-BTC") == None):
        print("업비트 로그인 에러")
    else:

        while True:
            현재날짜 = datetime.datetime.now(timezone('Asia/Seoul')).strftime('%Y-%m-%d %H:%M')
            if("08:59" in 현재날짜):
                # 9시가 되면, 원화마켓에 대해서 웹소켓 연결
                krw_tickers = pyupbit.get_tickers(fiat="KRW")
                krw_tickers = list(filter(lambda x: x not in 제외코인, krw_tickers))
                
                queue = mp.Queue()
                proc = mp.Process(
                    target=pyupbit.WebSocketClient,
                    args=('ticker', krw_tickers, queue),
                    daemon=True
                )
                proc.start()

                excel_data = pd.DataFrame()
                count  = 0

                # 9시 웹소켓 로직 실행
                while True:
                    count+=1
                    data = queue.get()

                    ts = data['trade_timestamp']
                    data["trade_timestamp"] = datetime.datetime.fromtimestamp(ts/1000)
                    data["signed_change_rate"] = data["signed_change_rate"] * 100
                    data["change_rate"] = data["change_rate"] * 100

                    # 엑셀 데이터 수집
                    if(len(excel_data) > 0):
                        new_excel_data = pd.DataFrame(data, index=[len(excel_data)])
                    else:
                        new_excel_data = pd.DataFrame(data, index=[0])

                    if len(excel_data) == 0:
                        excel_data = new_excel_data
                    else:
                        excel_data = pd.concat([excel_data, new_excel_data])
                        
                    # 수집 다했으면 종료
                    if(count == 최대수집데이터량):
                        excel_data.to_excel(f'급등데이터_{현재날짜}.xlsx', index=False)
                        break

                    # 급등여부 판단
                    # 100개의 데이터를 받았는데, 그중에 매수신호를 가장 많이 받은 녀석 구매
                    if (count == 100):
                        최근_n개데이터 = excel_data[-100:]
                        급등코인 = 최근_n개데이터[최근_n개데이터["ask_bid"] == "BID"]["code"].value_counts(sort=True).index[0]
                        급등코인_n개중_몇개 = 최근_n개데이터[최근_n개데이터["ask_bid"] == "BID"]["code"].value_counts(sort=True).values[0]
                        
                        print(f"{급등코인_n개중_몇개} / 100개 감지됨")
                        구매데이터 = 시장가매수(급등코인)
                        
                        내가_구매했던_데이터 = pyupbit.Upbit(A_key, S_key).get_order(구매데이터["uuid"][0])
                        
                        # 아직 체결이 안된 경우가 있을 수 있는듯
                        while(len(내가_구매했던_데이터["trades"]) == 0):
                            pass
                        
                        내가_구매했던_코인가격 = float(내가_구매했던_데이터["trades"][0]["price"])
                        지정가판매가격 = round(내가_구매했던_코인가격 * 손익률 , get_price_scale_tick(내가_구매했던_코인가격 * 손익률)[0])
                        print(f'{내가_구매했던_코인가격}에 구매한거를 {지정가판매가격}에 지정가매도')
                        지정가매도(급등코인, 지정가판매가격)


                # 완전히 종료
                proc.kill()
                proc.join()