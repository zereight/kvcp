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

손절률 = -3
손익률 = 4

구매했음 = False
내가_구매했던_signed_change_rate = 0
내가_구매했던_가격 = 0
최대수집데이터량 = 100000
급등코인 = ""

def 구매(market_code):
    print(f'{market_code} 구매')
    ## API로 업비트에서 내 계좌 조회
    my_exchange_account = pd.DataFrame(requests.get("https://api.upbit.com/v1/accounts", headers={"Authorization": 'Bearer {}'.format(jwt.encode({'access_key': A_key,'nonce': str(uuid.uuid4())}, S_key))}).json())
    print(my_exchange_account)
    now_krw = float(my_exchange_account[my_exchange_account['currency'] == 'KRW']['balance'][0])
    # 원화의 50%를 매수, 보유원화의 75%를 넘으면 에러를 뱉는다는 소리가 있음
    order_amount = round(now_krw * 0.5)
    send_email(f'{market_code} 구매', "9시 펌핑코인 매수")

    buy_market_order_data = pd.DataFrame.from_dict(pyupbit.Upbit(A_key, S_key).buy_market_order(market_code, order_amount), orient='index').T

    return buy_market_order_data

def 판매(market_code):
    print(f'{market_code} 판매')
    order_quantity = pyupbit.Upbit(A_key, S_key).get_balance(market_code)
    send_email(f'{market_code} 판매', "9시 펌핑코인 판매")
    sell_market_order_data = pd.DataFrame.from_dict(
        pyupbit.Upbit(A_key, S_key).sell_market_order(market_code, order_quantity), orient='index').T

    return sell_market_order_data


## 본 로직
if __name__ == "__main__":
    
    # 로그인테스트, 에러가나면 오류있는거
    pyupbit.Upbit(A_key, S_key).get_balance("KRW-BTC")

    while True:
        현재날짜 = datetime.datetime.now(timezone('Asia/Seoul')).strftime('%Y-%m-%d %H:%M')
        if("09:" in 현재날짜):
            # 9시가 되면, 원화마켓에 대해서 웹소켓 연결
            krw_tickers = pyupbit.get_tickers(fiat="KRW")
            queue = mp.Queue()
            proc = mp.Process(
                target=pyupbit.WebSocketClient,
                args=('ticker', krw_tickers, queue),
                daemon=True
            )
            proc.start()

            excel_data = pd.DataFrame()
            count  = 0

            # 9시 웹소켓 로직 실ㅇ
            while True:
                # 현재시간
                현재날짜 = datetime.datetime.now(timezone('Asia/Seoul')).strftime('%Y-%m-%d %H:%M')

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
                if(count == 최대수집데이터량):
                    현재날짜 = datetime.datetime.now(timezone('Asia/Seoul')).strftime('%Y-%m-%d')
                    excel_data.to_excel(f'급등데이터_{현재날짜}.xlsx', index=False)
                    break

                # 급등여부 판단
                # 100개의 데이터를 받았는데, 그중에 매수신호를 가장 많이 받은 녀석 구매
                if (count == 100):
                    급등코인 = excel_data[excel_data["ask_bid"] == "BID"]["code"].value_counts(sort=True).index[0]
                    내가_구매했던_signed_change_rate = data["signed_change_rate"]
                    구매데이터 = 구매(급등코인)
                    
                    구매했음 = True
                    내가_구매했던_가격 = int(구매데이터["price"][0])


                # 판매 감지 로직 실행
                if(구매했음 == True):
                    # 구매한뒤_등락율 = ((data["signed_change_rate"] / 내가_구매했던_signed_change_rate) * 100) - 100
                    구매한뒤_등락율 = ((data["trade_price"] / 내가_구매했던_가격) * 100) - 100
                    if(구매한뒤_등락율 > 손익률):
                        판매(급등코인) # 익절
                        구매했음 = False
                    elif(구매한뒤_등락율 < 손절률):
                        판매(급등코인) # 손절
                        구매했음 = False