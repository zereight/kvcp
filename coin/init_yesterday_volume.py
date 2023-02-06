# 출처1: "https://docs.upbit.com/reference/%EC%A0%84%EC%B2%B4-%EA%B3%84%EC%A2%8C-%EC%A1%B0%ED%9A%8C"
# 출처2: "https://github.com/sharebook-kr/pyupbit"
import requests, time, datetime
import pandas as pd
from pytz import timezone
from sendMail import send_email

def init_yesterday_volume():
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
    ############################## 오후 11시 전체 거래대금 순위 조회 ##############################
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
        time.sleep(0.1) # 0.1초 지연시켜 0.1초에 1번씩 조회
    ## "all_current_price"를 "sort_values"라는 함수로 "acc_trade_price_24h" 기준, "axis=0" 열 방향, "ascending=False" 내림차순 정렬
    all_current_price = all_current_price.sort_values(by=['acc_trade_price_24h'], axis=0, ascending=False).reset_index(drop=True)
    ## "all_current_price"의 행 번호에 1을 더한 값을 "rank"의 각 행에 저장
    all_current_price['rank'] = all_current_price.index + 1
    ## "acc_trade_price_24h"를 문자열로 지정
    all_current_price['acc_trade_price_24h'] = all_current_price['acc_trade_price_24h'].astype(str)
    ## "all_current_price"의 0 ~ 14행, 'rank', 'market', 'acc_trade_price_24h'열만 "current_price_rank"로 지정
    current_price_rank = all_current_price[['rank', 'market', 'acc_trade_price_24h']][:15]  ## rank: 순위, market: 종목 구분 코드, acc_trade_price_24h: 24시간 누적 거래대금

    # ==================== 수정할 부분 ====================
    ## 엑셀 파일 저장할 경로 지정
    save_path = './excel/'
    # ==================================================

    ## "current_price_rank"를 "save_path" 경로에 'upbit_trade_price_rank_오늘년월일_23'이라는 엑셀파일로 저장
    current_price_rank.to_excel(save_path + 'upbit_trade_price_rank_' + datetime.datetime.now().strftime('%Y%m%d') + '_23.xlsx', index=False)
    print(save_path + 'upbit_trade_price_rank_' + datetime.datetime.now().strftime('%Y%m%d') + '_23.xlsx 저장 완료')
    send_email("23시가 되어 init_yesterday_volume를 완료했습니다.", "init_yesterday_volume 완료")
    # ==================================================

main_sec = 0
while(True):
    current_time = datetime.datetime.now(timezone('Asia/Seoul')).strftime('%Y-%m-%d %H:%M')
    if("23:00" in current_time):
        send_email("23시가 되어 init_yesterday_volume를 실행합니다.", "init_yesterday_volume 실행")
        init_yesterday_volume()
    time.sleep(60)
    main_sec += 60
    if(main_sec % 600 == 0):
        main_sec = 0