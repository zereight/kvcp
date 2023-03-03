# 출처1: "https://docs.upbit.com/reference/%EC%A0%84%EC%B2%B4-%EA%B3%84%EC%A2%8C-%EC%A1%B0%ED%9A%8C"
# 출처2: "https://github.com/sharebook-kr/pyupbit"
import requests, time, jwt, uuid, pyupbit, datetime
import pandas as pd
import numpy as np
from sendMail import send_email
from upbit_module import 시장가매수, 지정가매도
import json
from getPriceScaleTick import get_price_scale_tick

f = open("업비트정보.private.json", "r")
api_key = json.load(f)
f.close()

A_key = api_key["accessKey"]  # 본인 access_key 키로 변경
S_key = api_key["secretKey"]  # 본인 secret_key 키로 변경

## 몇 초 간격으로 매도 타이밍을 체크 할 것인지
## 몇 시간 동안 매도 타이밍을 체크 할 것인지
loop_time = 60 * 24 * 100  # 100일 동안 체크

sec = 0 # 시작 값

# 지금 구매한 상태인가? (짧은시간내에 많이 구매되는 현상 방지)
is_already_bought = False

down_bound = 28
up_bound = 65

이미구매한코인 = []


while True:
    if sec % 3600 == 0:
        send_email("👍", "👍 RSI 1시간 이상무")

    ## 매매할 종목 설정
    krw_tickers = pyupbit.get_tickers(fiat="KRW")
    #market_code_list = ['KRW-BTC', 'KRW-ETH']
    # ==========================================================================================

    for market_code in krw_tickers:
        time.sleep(1)
        print(f'{market_code}를 보고 있습니다.')

        ## currency: 화폐를 의미하는 영문 대문자 코드, balance: 주문가능 금액/수량, locked: 주문 중 묶여있는 금액/수량
        ## avg_buy_price: 매수평균가, avg_buy_price_modified: 매수평균가 수정 여부, unit_currency: 평단가 기준 화폐
        ## API로 업비트에서 내 계좌 조회
        my_exchange_account = pd.DataFrame(requests.get("https://api.upbit.com/v1/accounts",
                                                        headers={"Authorization": 'Bearer {}'.format(
                                                            jwt.encode({'access_key': A_key,
                                                                        'nonce': str(uuid.uuid4())}, S_key))}).json())
        ## 보유 원화
        now_krw = float(my_exchange_account[my_exchange_account['currency'] == 'KRW']['balance'].tail())

        ## API로 업비트에서 15분 단위의 "고가", "시가", "저가", "종가" "거래량" 조회
        ohlcv_value = pyupbit.get_ohlcv(market_code, interval="minute15")
        ## 앞 뒤 "종가" 차이를 변화량 "change"로 지정
        ohlcv_value['change'] = ohlcv_value['close'] - ohlcv_value['close'].shift(1)
        ## 변화량 "change"가 0보다 크거나 같으면 "U"에 "change" 값을 지정하고, 아니면 "U"에 0을 지정
        ohlcv_value['U'] = np.where(ohlcv_value['change'] >= 0, ohlcv_value['change'], 0)
        ## 변화량 "change"가 0보다 작으면 "D"에 "change" 절대값을 지정하고, 아니면 "D"에 0을 지정
        ohlcv_value['D'] = np.where(ohlcv_value['change'] < 0, ohlcv_value['change'].abs(), 0)
        ## "ewm"라는 지수가중함수를 사용하여 평활계수 "alpha"에 "1/14", 계산을 위한 최소 기간 "min_periods"에 "14"를 입력하고
        ## "U"와 "D" 각각의 평균을 구해서 각각 "AU"와 "AD"로 지정
        ohlcv_value['AU'] = ohlcv_value['U'].ewm(alpha=1 / 14, min_periods=14).mean()
        ohlcv_value['AD'] = ohlcv_value['D'].ewm(alpha=1 / 14, min_periods=14).mean()
        ## "AU"를 "AD"로 나눠 "RS"로 지정
        ohlcv_value['RS'] = ohlcv_value['AU'] / ohlcv_value['AD']
        ## "AU"를 "AU"와 "AD"의 합으로 나눠 "RSI"로 지정
        ohlcv_value['RSI'] = ohlcv_value['AU'] / (ohlcv_value['AU'] + ohlcv_value['AD'])
        ## 가장 최근 "RSI"값을 "RSI_value"로 지정
        RSI_value = ohlcv_value[['RSI']].tail(n=1)
        # 0.xx단위로 나와서 100곱해줌
        RSI_value_number = float(RSI_value['RSI']) * 100 
        print(f'15분봉 RSI값은 {RSI_value_number}')
        
        if(RSI_value_number <= down_bound and market_code not in 이미구매한코인):
            
            my_exchange_account = pd.DataFrame(requests.get("https://api.upbit.com/v1/accounts", headers={"Authorization": 'Bearer {}'.format(jwt.encode({'access_key': A_key,'nonce': str(uuid.uuid4())}, S_key))}).json())
            now_krw = float(my_exchange_account[my_exchange_account['currency'] == 'KRW']['balance'][0])
            if(now_krw >= 6000):
                구매데이터 = 시장가매수(market_code, A_key, S_key)
                이미구매한코인.append(market_code)
                내가_구매했던_데이터 = pyupbit.Upbit(A_key, S_key).get_order(구매데이터["uuid"][0])

                # 아직 체결이 안된 경우가 있을 수 있는듯
                while(len(내가_구매했던_데이터["trades"]) == 0):
                    내가_구매했던_데이터 = pyupbit.Upbit(A_key, S_key).get_order(구매데이터["uuid"][0])
                    pass

                내가_구매했던_코인가격 = float(내가_구매했던_데이터["trades"][0]["price"])
                지정가판매가격_temp = 내가_구매했던_코인가격 * 1.005 # 0.5%수익
                지정가판매가격 = round(지정가판매가격_temp , get_price_scale_tick(지정가판매가격_temp)[0])
                print(f'{내가_구매했던_코인가격}에 구매한거를 {지정가판매가격}에 지정가매도')
                지정가매도(market_code, A_key, S_key, 지정가판매가격)
                time.sleep(60 * 60) # 60분대기
            else:
                print("원화부족")
        
    time.sleep(1)
    sec+=1
