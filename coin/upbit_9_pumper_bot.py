# https://docs.upbit.com/docs/upbit-quotation-websocket

import multiprocessing as mp
import pyupbit
import pandas as pd
import datetime
import json
from pytz import timezone
from sendMail import send_email

## 인증
f = open("업비트정보.private.json", "r")
api_key = json.load(f)
f.close()
A_key = api_key["accessKey"]  # 본인 access_key 키로 변경
S_key = api_key["secretKey"]  # 본인 secret_key 키로 변경

손절률 = 5
손익률 = 3

구매했음 = False
내가_구매한_가격 = 0
수익률 = 0

def 구매(market_code):
    now_krw = float(my_exchange_account[my_exchange_account['currency'] == 'KRW']['balance'][0])
    # 원화의 20%를 매수
    order_amount = round(now_krw * 0.2)
    buy_market_order_data = pd.DataFrame.from_dict(pyupbit.Upbit(A_key, S_key)
                                               .buy_market_order(market_code, order_amount), orient='index').T
    order_uuid = buy_market_order_data.uuid[0]
    specific_order = pd.DataFrame.from_dict(pyupbit.Upbit(A_key, S_key).get_order(order_uuid), orient='index').T
    내가_구매한_가격 = (round(float(specific_order['price'][0]) / float(specific_order['executed_volume'][0]), 2))
    print(specific_order['market'][0] + '을 매수가 ' + str(내가_구매한_가격) + '원에 ' +
      str(round(float(specific_order['executed_volume'][0]), 2)) + '개 구매')
    send_email(specific_order['market'][0] + '을 매수가 ' + str(내가_구매한_가격) + '원에 ' +
      str(round(float(specific_order['executed_volume'][0]), 2)) + '개 구매', "9시 급등코인 매수")
    
    구매했음 = True
    

def 판매(market_code):
    order_quantity = pyupbit.Upbit(A_key, S_key).get_balance(market_code)
    sell_market_order_data = pd.DataFrame.from_dict(
    pyupbit.Upbit(A_key, S_key).sell_market_order(market_code, order_quantity), orient='index').T
    print(str(ascent) + '% 상승하여 시장가 매도')
    send_email("매도", str(ascent) + '% 상승하여 시장가 매도')
    
    구매했음 = False
    수익률 = 0

## 본 로직
if __name__ == "__main__":
    
    krw_tickers = pyupbit.get_tickers(fiat="KRW")
    queue = mp.Queue()
    proc = mp.Process(
        target=pyupbit.WebSocketClient,
        args=('ticker', krw_tickers, queue),
        daemon=True
    )
    proc.start()

    while True:
        # 현재시간
        current_time = datetime.datetime.now(timezone('Asia/Seoul')).strftime('%Y-%m-%d %H:%M')

        data = queue.get()
        code = data['code']
        ts = data['trade_timestamp']

        전일대비등락율 = round(data['signed_change_rate'] * 100, 2)
        
        dt = datetime.datetime.fromtimestamp(ts/1000)
        print(dt, code, f'{전일대비등락율}%')
        
        # 오전 09:00시간에대 급등주 사버리기
        if("09:00" in current_time):
            # 7%뛴거 있으면 급등주
            if(전일대비등락율 >= 7):
                if(구매했음 == False):
                    구매(code)
                    pass
        
        # 구매상태면 이제 수익화를 위해서 기다리기
        if(구매했음 == True):
            
            ## 매수한 종목의 현재가와 앞서 구매한 가격의 차이를 구매한 가격으로 나누고 100을 곱하여 수익률을 구하고 "buy_market_price_ascent"로 지정
            수익률 = ((pyupbit.get_current_price(code)
                                           - 내가_구매한_가격)/내가_구매한_가격) * 100
            
            if(수익률 > 손익률):
                판매(code)
                pass
            elif (-손절률 > 수익률):
                판매(code)
                pass