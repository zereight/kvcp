# 출처1: "https://docs.upbit.com/reference/%EC%A0%84%EC%B2%B4-%EA%B3%84%EC%A2%8C-%EC%A1%B0%ED%9A%8C"
# 출처2: "https://github.com/sharebook-kr/pyupbit"
import requests, time, jwt, uuid, pyupbit, datetime
import pandas as pd
import numpy as np
import smtplib, ssl
from email.mime.text import MIMEText

import json
f = open("../메일정보.private.json", "r")

email_info = json.load(f)

f.close()

SMTP_SSL_PORT=465 # SSL connection
SMTP_SERVER="smtp.gmail.com"

# ======================================== 수정할 부분 ========================================
######################################################################
############################## 이메일 세팅 ##############################
######################################################################
# 내 정보 입력
SENDER_EMAIL=email_info["googleEmail"]    # SMTP 설정한 본인 Gmail
SENDER_PASSWORD=email_info["googleEmailSecret"]  # 발급 받은 16자리 앱 비밀번호

# 받는이 정보 입력
RECEIVER_EMAIL=email_info["kakaoEmail"]    # 받는 메일 주소(본인 카카오 이메일 주소 입력)

def send_email(content, title):
    msg = MIMEText(content)
    msg['Subject'] = title
    context = ssl.create_default_context()
    with smtplib.SMTP_SSL(SMTP_SERVER, SMTP_SSL_PORT, context=context) as server:
        server.login(SENDER_EMAIL, SENDER_PASSWORD)
        server.sendmail(SENDER_EMAIL, RECEIVER_EMAIL, msg.as_string())