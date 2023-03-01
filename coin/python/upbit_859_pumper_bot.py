# sudo yum install git
# curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash
# . ~/.nvm/nvm.sh
# nvm install v16.19.1
# nvm use v16.19.1
# pip3 install pyupbit
# pip3 install openpyxl
# *.private.json setting

# https://docs.upbit.com/docs/upbit-quotation-websocket

import multiprocessing as mp
import pyupbit
import pandas as pd
import numpy as np
import datetime
import json
from pytz import timezone
from sendMail import send_email
from getPriceScaleTick import get_price_scale_tick
from upbit_module import 시장가매수, 지정가매도
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
최대수집데이터량 = 200
급등코인 = ""
감지데이터수 = 100

제외코인 = ["KRW-BTT", "KRW-XRP"] # 리퍼리움 빼야하나..

## 본 로직
if __name__ == "__main__":
    
    # 로그인테스트, 에러가나면 오류있는거
    if(pyupbit.Upbit(A_key, S_key).get_balance("KRW-BTC") == None):
        print("업비트 로그인 에러")
    else:
        excel_data = pd.DataFrame()
        count  = 0
        현재날짜 = datetime.datetime.now(timezone('Asia/Seoul')).strftime('%Y-%m-%d %H:%M:%S')
        while "08:59:5" not in 현재날짜:
            현재날짜 = datetime.datetime.now(timezone('Asia/Seoul')).strftime('%Y-%m-%d %H:%M:%S')
            pass

        # 08:59:5 시가 되면, 원화마켓에 대해서 웹소켓 연결
        krw_tickers = pyupbit.get_tickers(fiat="KRW")
        krw_tickers = list(filter(lambda x: x not in 제외코인, krw_tickers))

        queue = mp.Queue()
        proc = mp.Process(
            target=pyupbit.WebSocketClient,
            args=('ticker', krw_tickers, queue),
            daemon=True
        )
        proc.start()

        # 웹소켓 로직 실행
        while count < 최대수집데이터량:
            count+=1
            data = queue.get()

            ts = data['trade_timestamp']
            data["trade_timestamp"] = datetime.datetime.fromtimestamp(ts/1000)
            data["signed_change_rate"] = data["signed_change_rate"] * 100
            data["change_rate"] = data["change_rate"] * 100

            # 엑셀 데이터 수집
            ## new_excel_data 초기화
            if(len(excel_data) > 0):
                new_excel_data = pd.DataFrame(data, index=[len(excel_data)])
            else:
                new_excel_data = pd.DataFrame(data, index=[0])
            ## 기존 excel_data에 추가
            if len(excel_data) == 0:
                excel_data = new_excel_data
            else:
                excel_data = pd.concat([excel_data, new_excel_data])

            # 급등여부 판단
            # 100개의 데이터를 받았는데, 그중에 매수신호를 가장 많이 받은 녀석 구매
            if (count == 감지데이터수):
                최근_n개데이터 = excel_data[-감지데이터수:]
                급등코인 = 최근_n개데이터[최근_n개데이터["ask_bid"] == "BID"]["code"].value_counts(sort=True).index[0]
                급등코인_n개중_몇개 = 최근_n개데이터[최근_n개데이터["ask_bid"] == "BID"]["code"].value_counts(sort=True).values[0]

                print(f"{급등코인_n개중_몇개} / {감지데이터수}개 감지됨")

                if(급등코인_n개중_몇개 > (감지데이터수 * 0.5)):
                    구매데이터 = 시장가매수(급등코인, A_key, S_key)

                    내가_구매했던_데이터 = pyupbit.Upbit(A_key, S_key).get_order(구매데이터["uuid"][0])

                    # 아직 체결이 안된 경우가 있을 수 있는듯
                    while(len(내가_구매했던_데이터["trades"]) == 0):
                        pass

                    내가_구매했던_코인가격 = float(내가_구매했던_데이터["trades"][0]["price"])
                    지정가판매가격 = round(내가_구매했던_코인가격 * 손익률 , get_price_scale_tick(내가_구매했던_코인가격 * 손익률)[0])
                    print(f'{내가_구매했던_코인가격}에 구매한거를 {지정가판매가격}에 지정가매도')
                    지정가매도(급등코인, A_key, S_key, 지정가판매가격)
                    
        # 수집 다했으면 저장
        excel_data.to_excel(f'급등데이터_{현재날짜}.xlsx', index=False)


        # 완전히 종료
        proc.kill()
        proc.join()