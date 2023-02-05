# 출처1: "https://docs.upbit.com/reference/%EC%A0%84%EC%B2%B4-%EA%B3%84%EC%A2%8C-%EC%A1%B0%ED%9A%8C"
# 출처2: "https://github.com/sharebook-kr/pyupbit"
import requests, time, jwt, uuid, pyupbit, datetime
import pandas as pd
import numpy as np
from sendMail import send_email
import json
f = open("업비트정보.private.json", "r")

api_key = json.load(f)

f.close()


# ======================================== 수정할 부분 ========================================
######################################################################
############################## 로그인 ##############################
######################################################################
# 업비트에서 발급 받았던 본인의 access_key와 secret_key 입력!!!
A_key = api_key["accessKey"]  # 본인 access_key 키로 변경
S_key = api_key["secretKey"]  # 본인 secret_key 키로 변경

######################################################################
############################## 매도 감시 ##############################
######################################################################
# 매도 감시
## 몇 초 간격으로 매도 타이밍을 체크 할 것인지
cycle_time = 1  # 1분 간격으로 체크
## 몇 시간 동안 매도 타이밍을 체크 할 것인지
loop_time = 60 * 12  # 12시간 동안 체크
# ==================================================

sec = 0 # 시작 값

# 지금 구매한 상태인가? (짧은시간내에 많이 구매되는 현상 방지)
is_already_bought = False

down_bound = 19
up_bound = 56


while sec < (loop_time * 60):
    if (sec == 60 * 10):
        # 10분이 지나면, 구매헀다는 플래그를 False로 만든다. (10분이면 중복구매해도 괜찮다고 가정함)
        is_already_bought = False
        
    if sec % 60 == 0:
        print(str(sec // 60) + '분 경과')
    # ======================================== 수정할 부분 ========================================
    ######################################################################
    ############################## 매매 종목 선택 ##############################
    ######################################################################
    ## 매매할 종목 설정
    market_code = 'KRW-BTC'
    # ==========================================================================================

    ################################################################################
    ############################## 내 계좌 보유 원화 조회 ##############################
    ################################################################################
    ## currency: 화폐를 의미하는 영문 대문자 코드, balance: 주문가능 금액/수량, locked: 주문 중 묶여있는 금액/수량
    ## avg_buy_price: 매수평균가, avg_buy_price_modified: 매수평균가 수정 여부, unit_currency: 평단가 기준 화폐
    ## API로 업비트에서 내 계좌 조회
    my_exchange_account = pd.DataFrame(requests.get("https://api.upbit.com/v1/accounts",
                                                    headers={"Authorization": 'Bearer {}'.format(
                                                        jwt.encode({'access_key': A_key,
                                                                    'nonce': str(uuid.uuid4())}, S_key))}).json())
    ## 보유 원화
    now_krw = float(my_exchange_account[my_exchange_account['currency'] == 'KRW']['balance'].tail())

    ####################################################################################################
    ######################################## RSI 지표 구하기  ########################################
    ####################################################################################################
    ## API로 업비트에서 1분 단위의 "고가", "시가", "저가", "종가" "거래량" 조회
    ohlcv_value = pyupbit.get_ohlcv(market_code, interval="minute1")
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
    print(f'1분봉 RSI값은 {RSI_value_number}')

    ## 보유 원화가 10000원 이상이면 들여 쓴 코드 실행
    if now_krw > 10000:
        ## RSI 지표가 down_bound% 이하이면 들여 쓴 코드 실행
        if RSI_value_number <= down_bound:
            ################################################################################
            #################### RSI 지표가 20% 이하 과매도 상태 시장가 매수 주문 실행 ####################
            ################################################################################
            
            # 시장가 매수
            ## 보유 원화의 20%가 10000원 이상이면 들여 쓴 코드 실행
            if round(now_krw * 0.2) >= 10000:
                ## 주문 금액을 보유 원화의 20%로 지정
                order_amount = round(now_krw * 0.2)
            ## 보유 원화의 20%가 10000원 미만이면 들여 쓴 코드 실행
            else:
                ## 주문 금액을 보유 원화의 20%가 아닌 10000원으로 지정
                order_amount = 10000

            ## uuid: 주문의 고유 아이디, side: 주문 종류, ord_type: 주문 방식, price: 주문 당시 화폐 가격, state: 주문 상태
            ## market: 마켓의 유일키, created_at: 주문 생성 시간, volume: 사용자가 입력한 주문 양, remaining_volume: 체결 후 남은 주문 양
            ## reserved_fee: 수수료로 예약된 비용, remaining_fee: 남은 수수료, paid_fee: 사용된 수수료, locked: 거래에 사용중인 비용
            ## executed_volume: 체결된 양, trades_count: 해당 주문에 걸린 체결 수
            ## API로 업비트에서 시장가 매수 진행
            if(is_already_bought == False):
                buy_market_order_data = pd.DataFrame.from_dict(pyupbit.Upbit(A_key, S_key)
                                                          .buy_market_order(market_code, order_amount), orient='index').T
                is_already_bought = True
                send_email("매수했어요", f'RSI 지표가 {down_bound}% 이하 과매도 상태 시장가 매수 ' + datetime.datetime.now().strftime('%Y-%m-%d %H시 %M분'))
                print(f'RSI 지표가 {down_bound}% 이하 과매도 상태 시장가 매수 ' + datetime.datetime.now().strftime('%Y-%m-%d %H시 %M분'))
            
        ## RSI 지표가 up_bound% 이상이면 들여 쓴 코드 실행
        elif RSI_value_number >= up_bound:
            ## 종목 보유량이 있는 경우 들여 쓴 코드 실행
            if pyupbit.Upbit(A_key, S_key).get_balance(market_code) > 0:
                ################################################################################
                ########## RSI 지표가 up_bound% 이상 보통과매수 상태 시장가(수익화) 매도 주문 실행 ##########
                ################################################################################
                # 시장가 매도
                order_quantity = pyupbit.Upbit(A_key, S_key).get_balance(market_code)

                ## uuid: 주문의 고유 아이디, side: 주문 종류, ord_type: 주문 방식, price: 주문 당시 화폐 가격, state: 주문 상태
                ## market: 마켓의 유일키, created_at: 주문 생성 시간, volume: 사용자가 입력한 주문 양, remaining_volume: 체결 후 남은 주문 양
                ## reserved_fee: 수수료로 예약된 비용, remaining_fee: 남은 수수료, paid_fee: 사용된 수수료, locked: 거래에 사용중인 비용
                ## executed_volume: 체결된 양, trades_count: 해당 주문에 걸린 체결 수
                ## API로 업비트에서 시장가 매도 진행
                sell_market_order_data = pd.DataFrame.from_dict(
                    pyupbit.Upbit(A_key, S_key).sell_market_order(market_code, order_quantity), orient='index').T
                
                send_email("매도했어요", f'RSI 지표가 {up_bound}% 이상 과매수 상태 시장가(수익화) 매도 ' + datetime.datetime.now().strftime('%Y-%m-%d %H시 %M분'))
                print(f'RSI 지표가 {up_bound}% 이상 과매수 상태 시장가(수익화) 매도')
            ## 종목 보유량이 없는 경우 들여 쓴 코드 실행
            else:
                send_email("매도못했어요", f'RSI 지표가 {up_bound}% 이상 과매수 상태지만 매도할 종목 보유량 없음 ' + datetime.datetime.now().strftime('%Y-%m-%d %H시 %M분'))
                print(f'RSI 지표가 {up_bound}% 이상 과매수 상태지만 매도할 종목 보유량 없음')
        ## RSI 지표가 down_bound% 초과 up_bound% 미만이면 들여 쓴 코드 실행
        else:
            print('대기')
    ## 보유 원화가 10000원 미만이면 들여 쓴 코드 실행
    else:
        ## 종목 보유량이 있는 경우 들여 쓴 코드 실행
        if pyupbit.Upbit(A_key, S_key).get_balance(market_code) > 0:
            ## RSI 지표가 20% 이하이면 들여 쓴 코드 실행
            if RSI_value_number <= down_bound:
                send_email("매수못했어요", f'RSI 지표가 {down_bound}% 이하 과매도 상태지만 매수할 원화 부족 ' + datetime.datetime.now().strftime('%Y-%m-%d %H시 %M분'))
                print(f'RSI 지표가 {down_bound}% 이하 과매도 상태지만 매수할 원화 부족')
            ## RSI 지표가 up_bound% 이상이면 들여 쓴 코드 실행
            elif RSI_value_number >= up_bound:
                ################################################################################
                ########## RSI 지표가 up_bound% 이상 과매수 상태 시장가(수익화) 매도 주문 실행 ##########
                ################################################################################
                # 시장가 매도
                order_quantity = pyupbit.Upbit(A_key, S_key).get_balance(market_code)

                ## uuid: 주문의 고유 아이디, side: 주문 종류, ord_type: 주문 방식, price: 주문 당시 화폐 가격, state: 주문 상태
                ## market: 마켓의 유일키, created_at: 주문 생성 시간, volume: 사용자가 입력한 주문 양, remaining_volume: 체결 후 남은 주문 양
                ## reserved_fee: 수수료로 예약된 비용, remaining_fee: 남은 수수료, paid_fee: 사용된 수수료, locked: 거래에 사용중인 비용
                ## executed_volume: 체결된 양, trades_count: 해당 주문에 걸린 체결 수
                ## API로 업비트에서 시장가 매도 진행
                sell_market_order_data = pd.DataFrame.from_dict(
                    pyupbit.Upbit(A_key, S_key).sell_market_order(market_code, order_quantity), orient='index').T
                
                send_email("매도했어요", f'RSI 지표가 {up_bound}% 이상 과매수 상태 시장가 매도 ' + datetime.datetime.now().strftime('%Y-%m-%d %H시 %M분'))
                print(f'RSI 지표가 {up_bound}% 이상 과매수 상태 시장가 매도')
            ## RSI 지표가 down_bound이상 up_bound이하이면 들여 쓴 코드 실행
            else:
                print('대기')
        ## 원화도 부족하고 종목 보유량도 없음
        else:
            send_email("원화입금필요!", '!!! 원화 입금 필요 !!! 원화도 부족하고 종목 보유량도 없음 ' + datetime.datetime.now().strftime('%Y-%m-%d %H시 %M분'))
            print('!!! 원화 입금 필요 !!! 원화도 부족하고 종목 보유량도 없음')
    time.sleep(cycle_time * 60)
    sec += (cycle_time * 60)
print(str(sec // 60) + '분 경과')
