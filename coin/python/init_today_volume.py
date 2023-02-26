# !!!!!!!!!! Terminal에 "pip install openpyxl"입력 후 "enter" 눌러 openpyxl를 설치해 주세요 !!!!!!!!!!
# 출처1: "https://docs.upbit.com/reference/%EC%A0%84%EC%B2%B4-%EA%B3%84%EC%A2%8C-%EC%A1%B0%ED%9A%8C"
# 출처2: "https://github.com/sharebook-kr/pyupbit"
import requests, time, datetime, jwt, uuid, pyupbit
import pandas as pd
import json
from pytz import timezone
from python.sendMail import send_email

f = open("업비트정보.private.json", "r")
api_key = json.load(f)
f.close()

A_key = api_key["accessKey"]  # 본인 access_key 키로 변경
S_key = api_key["secretKey"]  # 본인 secret_key 키로 변경

def init_today_volume():
    ####################################################################################################
    ############################## 전일 오후 11시 전체 24시간 거래대금 순위 불러오기 ##############################
    ####################################################################################################
    # ==================== 수정할 부분 ====================
    ## 엑셀 파일 저장 및 불러올 경로 지정
    save_path = './excel/'
    # ==================================================

    ## rank: 순위, market: 종목 구분 코드, acc_trade_price_24h: 24시간 누적 거래대금
    ## "current_price_rank23"에 'C:/Users/2101A00085/PycharmProjects/pythonProject/upbit_trade_price/' 경로에 'upbit_trade_price_rank_전일년월일_23'이라는 엑셀파일을 불러와 지정
    current_price_rank23 = pd.read_excel(save_path + 'upbit_trade_price_rank_' + (datetime.date.today() - datetime.timedelta(1)).strftime('%Y%m%d')
                                         + '_23.xlsx', engine='openpyxl')

    ####################################################################################################
    ############################## 업비트 원화 마켓에서 유의종목이 아닌 거래 목록 조회 ##############################
    ####################################################################################################
    ## market_warning: 유의 종목 여부(CAUTION - 투자유의), market: 업비트에서 제공중인 시장 정보("지불 수단"-"구매 코인" 형식)
    ## korean_name: 거래 대상 암호화폐 한글명, english_name: 거래 대상 암호화폐 영문명, market_type: 마켓 종류(KRW - 원화 마켓, BTC - 비트코인 마켓, USDT - 테더 마켓)
    ## API로 업비트에서 거래 가능한 마켓 목록 조회하여 "market_code_lookup"에 결과 지정
    market_code_lookup = pd.DataFrame(requests.get(
        "https://api.upbit.com/v1/market/all?isDetails=true", headers={"Accept": "application/json"}).json())
    ## "market"을 "-" 기준으로 나눠서 맨 앞의 문자인 마켓 종류를 "market_type"에 지정
    market_code_lookup['market_type'] = market_code_lookup.market.str.split('-').str[0]
    ## "market_code_lookup"을 "market_type"과 "korean_name" 열 기준으로 오름차순 정렬
    market_code_lookup = market_code_lookup.sort_values(
        by=['market_type', 'korean_name'], axis=0, ascending=True).reset_index(drop=True)

    # ==================== 추가된 부분 ====================
    ## “market_type”이 원화이면서 “market_warning”이 투자 유의가 아닌 경우들만 “market_code_lookup”에 다시 저장
    market_code_lookup = market_code_lookup[(market_code_lookup['market_type'] == 'KRW') &
                                            (market_code_lookup['market_warning'] != 'CAUTION')].reset_index(drop=True)
    # ==================================================

    ####################################################################################################
    ############################## 오전 8시 30분 전체 24시간 거래대금 순위 조회 ##############################
    ####################################################################################################
    ## 조회 할 시장 정보
    market_code = market_code_lookup['market']
    ## 빈 DataFrame을 "all_current_price"로 지정
    all_current_price = pd.DataFrame()
    ## 조회 할 시장 정보 숫자 만큼 들여 쓴 코드 반복
    for i in range(len(market_code)):
        print(str(len(market_code)) + '건 중에 ' + str(i+1) + '번째 진행중')
        ## API로 업비트에서 특정 종목 현재가 정보 조회
        current_price = pd.DataFrame(requests.get("https://api.upbit.com/v1/ticker?markets=" + market_code[i],
                                                  headers={"Accept": "application/json"}).json())
        ## 특정 종목 현재가 정보 조회 시간인 "timestamp"가 협정 세계시(UTC) 기준으로 표기되기 때문에 9시간을 더해 한국 표준시(KST)로 변경
        current_price.timestamp = pd.to_datetime(current_price.timestamp, unit='ms') + pd.DateOffset(hours=9)
        ## "timestamp"에서 날짜를 "date"로 저장
        current_price['date'] = current_price.timestamp.dt.date
        ## "timestamp"에서 시간을 "time"로 저장
        current_price['time'] = current_price.timestamp.dt.time
        ## 'trade_date', 'trade_time', 'trade_date_kst', 'trade_time_kst', 'trade_timestamp', 'timestamp' 열 삭제
        current_price.drop(['trade_date', 'trade_time', 'trade_date_kst', 'trade_time_kst',
                            'trade_timestamp', 'timestamp'], axis=1, inplace=True)
        ## "all_current_price"에 "current_price"를 결합
        all_current_price = pd.concat([all_current_price, current_price]).reset_index(drop=True)

    # ==================== 추가된 부분 ====================
    ## 업비트에서 시간당 요청 수 제한이 있어서 시간을 지연시켜 줌
    ## 주문 요청 API는 초당 8회, 분당 200회 가능
    ## 주문 요청 외 API는 초당 30회, 분당 900회 가능
        time.sleep(0.1)  # 0.1초 지연시켜 0.1초에 1번씩 조회
    ## "all_current_price"를 "sort_values"라는 함수로 "acc_trade_price_24h" 기준, "axis=0" 열 방향, "ascending=False" 내림차순 정렬
    all_current_price = all_current_price.sort_values(by=['acc_trade_price_24h'], axis=0, ascending=False).reset_index(drop=True)
    ## "all_current_price"의 행 번호에 1을 더한 값을 "rank"의 각 행에 저장
    all_current_price['rank'] = all_current_price.index + 1
    ## "acc_trade_price_24h"를 문자열로 지정
    all_current_price['acc_trade_price_24h'] = all_current_price['acc_trade_price_24h'].astype(str)
    ## "all_current_price"의 0 ~ 14행, 'rank', 'market', 'acc_trade_price_24h'열만 "current_price_rank"로 지정
    current_price_rank8 = all_current_price[['rank', 'market', 'acc_trade_price_24h']][:15]
    ## "current_price_rank"를 'C:/Users/2101A00085/PycharmProjects/pythonProject/upbit_trade_price/' 경로에 'upbit_trade_price_rank_오늘년월일_8'이라는 엑셀파일로 저장
    current_price_rank8.to_excel(save_path + 'upbit_trade_price_rank_' + datetime.date.today().strftime('%Y%m%d') + '_8.xlsx', index=False)
    # ==================================================

    ####################################################################################################
    #################### 오전 8시 30분 기준 24시간 거래대금 순위 10위권 진입 상승 종목 추출 ####################
    ####################################################################################################
    ## "오전 8시 30분 기준 24시간 거래대금 순위"에 "전일 오후 11시 전체 24시간 거래대금 순위"를 "market" 기준으로 매칭하여 "current_price_change"으로 지정
    current_price_change = pd.merge(current_price_rank8, current_price_rank23, how='left', on='market')
    ## "current_price_change"의 "acc_trade_price_24h_x"와 "acc_trade_price_24h_y"를 실수형으로 지정
    current_price_change['acc_trade_price_24h_x'] = current_price_change['acc_trade_price_24h_x'].astype(float)
    current_price_change['acc_trade_price_24h_y'] = current_price_change['acc_trade_price_24h_y'].astype(float)
    ## "change"에 각 행의 "오전 8시 30분 기준 24시간 거래대금"과 "전일 오후 11시 전체 24시간 거래대금" 변동액을 지정
    current_price_change['change'] = current_price_change['acc_trade_price_24h_x'] - current_price_change['acc_trade_price_24h_y']
    ## 10위권 진입 순위 상승 종목 중에 24시간 거래대금 변동액이 양수이면서 변동액이 가장 큰 종목 선택
    volume_rising_stocks = current_price_change[(current_price_change['rank_x'] < 10) &
                                                (current_price_change['rank_x'] < current_price_change['rank_y']) &
                                                (current_price_change['change'] > 0)].sort_values(by=['change'], axis=0, ascending=False).reset_index(drop=True)['market'][0]

    ####################################################################################################
    ######################################## 상황별 매매 ########################################
    ####################################################################################################
    ## "volume_rising_stocks"에 값이 있으면 들여 쓴 코드 실행
    if volume_rising_stocks is not None:
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

        # ==================== 추가된 부분 ====================
        ## 보유 원화
        now_krw = float(my_exchange_account[my_exchange_account['currency'] == 'KRW']['balance'][0])
        # ==================================================

        ## 보유 원화가 7000원 이상이면 들여 쓴 코드 실행
        if now_krw >= 7000:
            ######################################################################
            ############################## 시장가 매수 주문 실행 ##############################
            ######################################################################
            # 시장가 매수
            ## 주문할 시장 정보
            market_code = volume_rising_stocks
            ## 주문 금액(단위: KRW or BTC or USDT)
            ## 보유 원화의 20%가 6000원 이상이면 들여 쓴 코드 실행
            if round(now_krw * 0.2) >= 6000:
                ## 주문 금액을 보유 원화의 20%로 지정
                order_amount = round(now_krw * 0.2)
            ## 보유 원화의 20%가 6000원 미만이면 들여 쓴 코드 실행
            else:
                ## 주문 금액을 보유 원화의 20%가 아닌 6000원으로 지정
                order_amount = 6000

            ## uuid: 주문의 고유 아이디, side: 주문 종류, ord_type: 주문 방식, price: 주문 당시 화폐 가격, state: 주문 상태
            ## market: 마켓의 유일키, created_at: 주문 생성 시간, volume: 사용자가 입력한 주문 양, remaining_volume: 체결 후 남은 주문 양
            ## reserved_fee: 수수료로 예약된 비용, remaining_fee: 남은 수수료, paid_fee: 사용된 수수료, locked: 거래에 사용중인 비용
            ## executed_volume: 체결된 양, trades_count: 해당 주문에 걸린 체결 수
            ## API로 업비트에서 시장가 매수 진행
            buy_market_order_data = pd.DataFrame.from_dict(pyupbit.Upbit(A_key, S_key)
                                                           .buy_market_order(market_code, order_amount), orient='index').T

            ######################################################################
            ############################## 시장가 매수 주문 조회 ##############################
            ######################################################################
            # 특정 주문 조회
            ## 조회할 주문 uuid
            order_uuid = buy_market_order_data.uuid[0]

            ## uuid: 주문의 고유 아이디, side: 주문 종류, ord_type: 주문 방식, price: 주문 당시 화폐 가격, state: 주문 상태
            ## market: 마켓의 유일 키, created_at: 주문 생성 시간, volume: 사용자가 입력한 주문 양, remaining_volume: 체결 후 남은 주문 양
            ## reserved_fee: 수수료로 예약된 비용, remaining_fee: 남은 수수료, paid_fee: 사용된 수수료, locked: 거래에 사용중인 비용
            ## executed_volume: 체결된 양, trades_count: 해당 주문에 걸린 체결 수
            ## API로 업비트에서 특정 주문 조회
            specific_order = pd.DataFrame.from_dict(pyupbit.Upbit(A_key, S_key).get_order(order_uuid), orient='index').T
            ## "price"를 "executed_volume"로 나눠 매수가를 구하고 "buy_market_order_price"으로 지정
            buy_market_order_price = (round(float(specific_order['price'][0]) / float(specific_order['executed_volume'][0]), 2))
            print(specific_order['market'][0] + '을 매수가 ' + str(buy_market_order_price) + '원에 ' +
                  str(round(float(specific_order['executed_volume'][0]), 2)) + '개 구매')
            send_email(specific_order['market'][0] + '을 매수가 ' + str(buy_market_order_price) + '원에 ' +
                  str(round(float(specific_order['executed_volume'][0]), 2)) + '개 구매', "급등코인 매수")
            # ==================== 추가된 부분 ====================
            ######################################################################
            ############################## 매도 감시 ##############################
            ######################################################################
            # ==================== 수정할 부분 ====================
            ## 몇 초 간격으로 매도 타이밍을 체크 할 것인지
            cycle_time = 1  # 1초 간격으로 체크(최대 0.04초 간격으로 조회 가능)
            ## 몇 시간 동안 매도 타이밍을 체크 할 것인지
            loop_time = 12  # 12시간 동안 체크
            ## 몇 프로 이상 상승하면 수익화 할 것인지
            ascent = 5  # 5% 상승
            ## 몇 프로 이상 하락하면 손절 할 것인지
            downhill = 5  # 5% 하락
            # ==================================================

            sec = 0 # 시작 값
            ## "sec" 값이 43200(12시간 초)보다 작을 때까지만 들여 쓴 코드 반복 실행
            while sec < (loop_time * 3600):
                ## "sec" 값을 60으로 나눴을 때 나머지가 0일 경우만 들여 쓴 코드 반복 실행
                if sec%60 == 0:
                    ## "sec" 값을 60으로 나눴을 때 몫을 분으로 출력
                    print(str(sec//60) + '분 경과')
                    send_email(str(sec//60) + '분 경과', "기다리는중")
                ## 매수한 종목의 현재가와 앞서 구매한 가격의 차이를 구매한 가격으로 나누고 100을 곱하여 수익률을 구하고 "buy_market_price_ascent"로 지정
                buy_market_price_ascent = (pyupbit.get_current_price(market_code)
                                           - buy_market_order_price)/buy_market_order_price*100
                ## 수익률이 5% 미만인 순간 들여 쓴 코드 실행
                if buy_market_price_ascent < ascent:
                    ## 수익률이 -5% 초과 5% 미만인 순간 들여 쓴 코드 실행
                    if buy_market_price_ascent > (-downhill):
                        ## 업비트에서 시간당 요청 수 제한이 있어서 시간을 지연시켜 줌
                        ## 주문 요청 API는 초당 8회, 분당 200회 가능
                        ## 주문 요청 외 API는 초당 30회, 분당 900회 가능
                        time.sleep(cycle_time)  # 1초 지연시켜 1초에 1번씩 조회
                        sec += cycle_time   # 시작 값에 지연시킨 1초를 더해 sec를 경과 초로 지정
                    ## 수익률이 -5% 이하인 순간 들여 쓴 코드 실행
                    else:
            # ==================================================

                        ##########################################################################################
                        ############################## 시장가 매도(손절) 주문 실행 ##############################
                        ##########################################################################################
                        # 시장가 매도(손절)
                        ## 주문할 시장 정보
                        market_code = volume_rising_stocks
                        ## 주문 수량
                        order_quantity = pyupbit.Upbit(A_key, S_key).get_balance(market_code)   # 특정 종목 보유 수량

                        ## uuid: 주문의 고유 아이디, side: 주문 종류, ord_type: 주문 방식, price: 주문 당시 화폐 가격, state: 주문 상태
                        ## market: 마켓의 유일키, created_at: 주문 생성 시간, volume: 사용자가 입력한 주문 양, remaining_volume: 체결 후 남은 주문 양
                        ## reserved_fee: 수수료로 예약된 비용, remaining_fee: 남은 수수료, paid_fee: 사용된 수수료, locked: 거래에 사용중인 비용
                        ## executed_volume: 체결된 양, trades_count: 해당 주문에 걸린 체결 수
                        ## API로 업비트에서 시장가 매도(손절) 진행
                        sell_market_order_data = pd.DataFrame.from_dict(
                            pyupbit.Upbit(A_key, S_key).sell_market_order(market_code, order_quantity), orient='index').T
                        print(str(-downhill) + '% 하락하여 시장가 매도 손절')
                        send_email("매도", str(ascent) + '% 상승하여 시장가 매도 손절ㅠ')
                ## 수익률이 5% 이상인 순간 들여 쓴 코드 실행
                else:
                    ##########################################################################################
                    ############################## 시장가 매도(수익화) 주문 실행 ##############################
                    ##########################################################################################
                    # 시장가 매도(수익화)
                    ## 주문할 시장 정보
                    market_code = volume_rising_stocks
                    ## 주문 수량
                    order_quantity = pyupbit.Upbit(A_key, S_key).get_balance(market_code)

                    ## uuid: 주문의 고유 아이디, side: 주문 종류, ord_type: 주문 방식, price: 주문 당시 화폐 가격, state: 주문 상태
                    ## market: 마켓의 유일키, created_at: 주문 생성 시간, volume: 사용자가 입력한 주문 양, remaining_volume: 체결 후 남은 주문 양
                    ## reserved_fee: 수수료로 예약된 비용, remaining_fee: 남은 수수료, paid_fee: 사용된 수수료, locked: 거래에 사용중인 비용
                    ## executed_volume: 체결된 양, trades_count: 해당 주문에 걸린 체결 수
                    ## API로 업비트에서 시장가 매도(수익화) 진행
                    sell_market_order_data = pd.DataFrame.from_dict(
                        pyupbit.Upbit(A_key, S_key).sell_market_order(market_code, order_quantity), orient='index').T
                    print(str(ascent) + '% 상승하여 시장가 매도 수익화')
                    send_email("매도", str(ascent) + '% 상승하여 시장가 매도 수익화')
            ################################################################################
            #################### 감시 시간 종료 시장가 매도 주문 실행 ####################
            ################################################################################
            # 감시 시간 종료 시장가 매도
            ## 주문할 시장 정보
            market_code = volume_rising_stocks
            ## 주문 수량
            order_quantity = pyupbit.Upbit(A_key, S_key).get_balance(market_code)

            ## uuid: 주문의 고유 아이디, side: 주문 종류, ord_type: 주문 방식, price: 주문 당시 화폐 가격, state: 주문 상태
            ## market: 마켓의 유일키, created_at: 주문 생성 시간, volume: 사용자가 입력한 주문 양, remaining_volume: 체결 후 남은 주문 양
            ## reserved_fee: 수수료로 예약된 비용, remaining_fee: 남은 수수료, paid_fee: 사용된 수수료, locked: 거래에 사용중인 비용
            ## executed_volume: 체결된 양, trades_count: 해당 주문에 걸린 체결 수
            ## API로 업비트에서 감시 시간 종료로 시장가 매도 진행
            sell_market_order_data = pd.DataFrame.from_dict(
                pyupbit.Upbit(A_key, S_key).sell_market_order(market_code, order_quantity), orient='index').T
            print(str(loop_time) + '시간 경과 매수가 대비 수익률' + str(buy_market_price_ascent) + '%로 시장가 매도')
        ## 보유 원화가 7000원 미만이면 들여 쓴 코드 실행
        else:
            send_email("원화없다", '보유 원화 7000원 미만으로 원화 입금 필요')
            print('보유 원화 7000원 미만으로 원화 입금 필요')
            time.sleep(5)  # 5초 대기
    ## "volume_rising_stocks"에 값이 없으면 들여 쓴 코드 실행
    else:
        send_email("없네", '금일 거래량 조건 맞는 종목 없음')
        print('금일 거래량 조건 맞는 종목 없음')
        time.sleep(5)  # 5초 대기


main_sec = 0
while(True):
    current_time = datetime.datetime.now(timezone('Asia/Seoul')).strftime('%Y-%m-%d %H:%M')
    if(("08:30" in current_time) | ("09:00" in current_time)):
        send_email("아침이 init_today_volume를 실행합니다.", "init_to_volume 실행")
        init_today_volume()
    time.sleep(60)
    main_sec += 60
    if(main_sec % 600 == 0):
        main_sec = 0