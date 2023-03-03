import pyupbit
import pandas as pd
from pytz import timezone
from sendMail import send_email
import requests, jwt, uuid

def 시장가매수(market_code, A_key, S_key):
    print(f'{market_code} 구매')
    ## API로 업비트에서 내 계좌 조회
    my_exchange_account = pd.DataFrame(requests.get("https://api.upbit.com/v1/accounts", headers={"Authorization": 'Bearer {}'.format(jwt.encode({'access_key': A_key,'nonce': str(uuid.uuid4())}, S_key))}).json())
    print(my_exchange_account)
    now_krw = float(my_exchange_account[my_exchange_account['currency'] == 'KRW']['balance'][0])
    # 보유원화의 75%를 넘으면 에러를 뱉는다는 소리가 있음
    order_amount = 6000 # round(now_krw * 0.2)
    send_email(f'{market_code} 구매', f"9시 펌핑코인 {order_amount}원 시장가 매수")

    buy_market_order_data = pd.DataFrame.from_dict(pyupbit.Upbit(A_key, S_key).buy_market_order(market_code, order_amount), orient='index').T

    return buy_market_order_data









def 지정가매도(market_code,  A_key, S_key, 판매할가격):
    print(f'{market_code} 판매')
    order_quantity = pyupbit.Upbit(A_key, S_key).get_balance(market_code)
    send_email(f'{market_code} 판매', f"9시 펌핑코인 {order_quantity}개 지정가 매도")
    sell_market_order_data = pd.DataFrame.from_dict(
        pyupbit.Upbit(A_key, S_key).sell_limit_order(market_code, 판매할가격 ,order_quantity), orient='index').T

    return sell_market_order_data
