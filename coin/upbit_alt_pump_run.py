# 원화마켓o, 유의종목x, BTCx 코인에 대해서
# 실시간으로 1분봉의 정보들을 가져오고
# 1초마다 체크해서
# 1분안에 이전 1분봉대비 10%가 오른 코인에 대해서
# 원화의 20%를 시장가매수하고
# 1초마다 체크해서
# 5%이상의 수익이 나오면 시장가매도를 한다.
# 계속 반복한다.

import requests, time, jwt, uuid, pyupbit, datetime
import pandas as pd
import numpy as np
from sendMail import send_email
import json

f = open("업비트정보.private.json", "r")
api_key = json.load(f)
f.close()

A_key = api_key["accessKey"]  # 본인 access_key 키로 변경
S_key = api_key["secretKey"]  # 본인 secret_key 키로 변경

tickers = pyupbit.get_tickers(fiat="KRW") # 유의종목포함했음

## 몇 프로 이상 상승하면 수익화 할 것인지
ascent = 5  # 5% 상승
## 몇 프로 이상 하락하면 손절 할 것인지
downhill = 5  # 5% 하락

while(1):
    for market_code in tickers:
        time.sleep(0.1)

        ## BTT는 너무 단위가 작아서..
        if market_code in ["KRW-BTC", "KRW-ETH", "KRW-XRP", "KRW-BTT"]:
            continue

        print(market_code, f'{pyupbit.get_current_price(market_code)}원')

        ## API로 업비트에서 내 계좌 조회
        my_exchange_account = pd.DataFrame(requests.get("https://api.upbit.com/v1/accounts",
                                                            headers={"Authorization": 'Bearer {}'.format(
                                                                jwt.encode({'access_key': A_key,
                                                                            'nonce': str(uuid.uuid4())}, S_key))}).json())
        now_krw = float(my_exchange_account[my_exchange_account['currency'] == 'KRW']['balance'].tail())

        ## 7000원이 없으면, 5분대기 후 재실행
        if now_krw < 7000:
            time.sleep(60 * 5)
            continue

        ## 1분전 대비 10%급등한지 검증
        ohlcv_value = pyupbit.get_ohlcv(market_code, interval="minute1")
        ohlcv_value['change'] = ohlcv_value['close'] - ohlcv_value['close'].shift(1)
        ohlcv_value['change_rate'] = (ohlcv_value['close'] / ohlcv_value['close'].shift(1)) * 100

        # 지금 코인을 구매한 상태인지 체크한다.
        was_coin_bought = False

        ## 10%이상 급등했을때
        if ohlcv_value['change_rate'][-1] > 110:
            # 시장가 구매
            if round(now_krw * 0.2) >= 7000:
                ## 주문 금액을 보유 원화의 20%로 지정
                order_amount = round(now_krw * 0.2)
            else:
                order_amount = 7000

            ## API로 업비트에서 시장가 매수 진행
            buy_market_order_data = pd.DataFrame.from_dict(pyupbit.Upbit(A_key, S_key)
                                                           .buy_market_order(market_code, order_amount), orient='index').T

            # 특정 주문 조회
            ## 조회할 주문 uuid
            order_uuid = buy_market_order_data.uuid[0]
            ## API로 업비트에서 특정 주문 조회
            specific_order = pd.DataFrame.from_dict(pyupbit.Upbit(A_key, S_key).get_order(order_uuid), orient='index').T
            buy_market_order_price = (round(float(specific_order['price'][0]) / float(specific_order['executed_volume'][0]), 2))
            send_email(specific_order['market'][0] + '을 매수가 ' + str(buy_market_order_price) + '원에 ' +
                  str(round(float(specific_order['executed_volume'][0]), 5)) + '개 구매',"급등코인매수!")
            print(specific_order['market'][0] + '을 매수가 ' + str(buy_market_order_price) + '원에 ' +
                  str(round(float(specific_order['executed_volume'][0]), 5)) + '개 구매')

            was_coin_bought = True
        else:
            print(f"{market_code}은 10%이상 급등하지 않았습니다. {ohlcv_value['change_rate'][-1]}%변동")

        ## 지금 매수한 상태면 계속 매도하기 위해서 대기한다.
        while(was_coin_bought):
            time.sleep(1)

            current_price = pd.DataFrame(requests.get("https://api.upbit.com/v1/ticker?markets=" + market_code,
                                                  headers={"Accept": "application/json"}).json())

            order_quantity = pyupbit.Upbit(A_key, S_key).get_balance(market_code)   # 특정 종목 보유 수량
            ## 현재구매한 코인의 시가가 구매가보다 ascent이상이면 수익화한다.
            ascent_rate = (current_price/buy_market_order_price)*100 - 100

            if(ascent_rate >= ascent):
                sell_market_order_data = pd.DataFrame.from_dict(
                            pyupbit.Upbit(A_key, S_key).sell_market_order(market_code, order_quantity), orient='index').T
                print(str(ascent) + '% 증가하여 시장가 매도 익절')
                send_mail(str(ascent) + '% 증가하여 시장가 매도 익절', "급등주 매도 익절!")

                was_coin_bought = False

            ## 현재구매한 코인의 시가가 구매가보다 downhill미만이면 손절한다
            downhill_rate = -ascent_rate

            if(downhill_rate > downhill):
                sell_market_order_data = pd.DataFrame.from_dict(
                            pyupbit.Upbit(A_key, S_key).sell_market_order(market_code, order_quantity), orient='index').T
                print(str(downhill) + '% 하락하여 시장가 매도 손절')
                send_mail(str(downhill) + '% 하락하여 시장가 매도 손절', "급등주 매도 손절ㅠ")

                was_coin_bought = False
