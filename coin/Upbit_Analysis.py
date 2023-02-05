import requests
from ast import literal_eval
import time
import numpy as np
import pandas as pd
import operator
import threading

import os



def notify(title, text):
	os.system("""
              osascript -e 'display notification "{}" with title "{}"'
              """.format(text, title))
	os.system("afplay /System/Library/Sounds/Sosumi.aiff")


#RSI계산 함수
def rsi_calculate(l, n, sample_number): #l = price_list, n = rsi_number
	
    diff=[]
    au=[]
    ad=[]

    if len(l) != sample_number: #url call error
        return -1 
    for i in range(len(l)-1):
        diff.append(l[i+1]-l[i]) #price difference
    
    au = pd.Series(diff) #list to series
    ad = pd.Series(diff)

    au[au<0] = 0 #remove ad
    ad[ad>0] = 0 #remove au

    _gain = au.ewm(com = n, min_periods = sample_number -1).mean() #Exponentially weighted average
    _loss = ad.abs().ewm(com = n, min_periods = sample_number -1).mean()
    RS = _gain/_loss

    rsi = 100-(100 / (1+RS.iloc[-1]))

    return rsi

#마켓코드조회
def market_code():

	url = "https://api.upbit.com/v1/market/all"
	querystring = {"isDetails":"false"}
	response = requests.request("GET", url, params=querystring)

	#코인이름 - 마켓코드 매핑
	r_str = response.text
	r_str = r_str.lstrip('[') #첫 문자 제거
	r_str = r_str.rstrip(']') #마지막 문자 제거
	r_list = r_str.split("}") #str를 }기준으로 쪼개어 리스트로 변환

	name_to_code = {}
	code_list = []

	for i in range(len(r_list)-1):
	    r_list[i] += "}"
	    if i!=0:
	        r_list[i] = r_list[i].lstrip(',')
	    r_dict = literal_eval(r_list[i]) #element to dict
	    if r_dict["market"][0]=='K': #원화거래 상품만 추출
	    	temp_dict = {r_dict["market"]:r_dict["korean_name"]}
	    	code_list.append(r_dict["market"]) #코드 리스트
	    	name_to_code.update(temp_dict) #코인이름 - 코드 매핑(딕셔너리)
	return code_list, name_to_code

def RSI_analysis(code_list, name_to_code, time_unit, unit, target_up = 70, target_down = 30, option = "down"): #1분 RSI 분석

	start = time.time()

	url = "https://api.upbit.com/v1/candles/"+time_unit+"/"+str(unit) # 1, 3, 5, 10, 15, 30, 60, 240

	coin_to_price = {}
	rsi_list = []
	rsi_number = 14
	sample = 200
	request_limit_per_second = -10
	request_count = 0
	request_time_list = np.array([])

	#코인별 시간별 가격 
	for i in range(len(code_list)):
	    querystring = {"market":code_list[i],"count":str(sample)} #캔들 갯수
	    if (request_count<request_limit_per_second): #max api 요청수, 분당 600, 초당 10회
	        request_count+=1 #요청수 1회 증가
	    else:
	        request_time_sum = np.sum(request_time_list[request_limit_per_second:])
	        if (request_time_sum >= 1):
	            pass
	        else:
	            time.sleep(1-request_time_sum)

	    times = time.time() #요청 시작 시간
	    response = requests.request("GET", url, params=querystring)
	    request_time_list = np.append(request_time_list, time.time()-times) #요청 끝 시간
	    r_str = response.text
	    r_str = r_str.lstrip('[') #첫 문자 제거
	    r_str = r_str.rstrip(']') #마지막 문 제거
	    r_list = r_str.split("}") #str를 }기준으로 쪼개어 리스트로 변환

	    date_to_price = {}
	    price_list = []

	    for j in range(len(r_list)-1):
	        r_list[j] += "}"
	        if j!=0:
	            r_list[j] = r_list[j].lstrip(',')
	        r_dict = literal_eval(r_list[j]) #stinrg to dict 
	        temp_dict = {r_dict["candle_date_time_kst"]:r_dict["trade_price"]}
	        date_to_price.update(temp_dict) #시간-가격 매핑
	        price_list.append(r_dict["trade_price"]) #가격 리스트
	    price_list.reverse() #order : past -> now 
	    temp_dict = {code_list[i]:date_to_price}
	    coin_to_price.update(temp_dict) #코인-시간-가격 매핑
	    
	    rsi_list.append(rsi_calculate(price_list, rsi_number, sample)) #RSI 계산

	target_dict = {}

	if option == "multi":

		for i in range(len(rsi_list)):
			if (rsi_list[i]<target_down and rsi_list[i]>=0) or i==0 : #비트코인 포함, rsi가 음수인 빈리스트 제외 
				target_dict.update({name_to_code[code_list[i]]: rsi_list[i]})
		if len(target_dict) <= 1:
			print("no data")
			pass
		else:
			notify("Bot", "코인 감지")
			print("#########RSI "+str(target_down)+"미만 코인##########")
			print("#####Time unit : "+time_unit+" "+str(unit)+" #########\n")
			
			target_dict = sorted(target_dict.items(), key=operator.itemgetter(1))

			for i in target_dict:
			    print("코인:%s\tRSI:%d"%(i[0],i[1]))

		target_dict = {}

		for i in range(len(rsi_list)):
			if (rsi_list[i]>target_up) or i==0: 
				target_dict.update({name_to_code[code_list[i]]: rsi_list[i]})
		if len(target_dict) <= 1:
			print("no data")
			pass
		else:
			notify("Bot", "코인 감지")
			print("\n#########RSI "+str(target_up)+"이상 코인##########")
			print("#####Time unit : "+time_unit+" "+str(unit)+" #########\n")
			
			target_dict = sorted(target_dict.items(), key=operator.itemgetter(1))
			for i in target_dict:
				print("코인:%s\tRSI:%d"%(i[0],i[1]))
			end = time.time() 
			print("\nRunning time : ", end-start)
			print("현재시간 : "+time.strftime('%c', time.localtime(time.time()))+"\n")

	elif option == "up":

		for i in range(len(rsi_list)):
			if (rsi_list[i]>target_up) or i==0:
				target_dict.update({name_to_code[code_list[i]]: rsi_list[i]})
		if len(target_dict) <= 1:
			print("no data")
			pass
		else:
			notify("Bot", "코인 감지")
			print("\n#########RSI "+str(target_up)+"이상 코인##########")
			print("#####Time unit : "+time_unit+" "+str(unit)+" #########\n")
			
			target_dict = sorted(target_dict.items(), key=operator.itemgetter(1))
			for i in target_dict:
				print("코인:%s\tRSI:%d"%(i[0],i[1]))
			end = time.time() 
			print("\nRunning time : ", end-start)
			print("현재시간 : "+time.strftime('%c', time.localtime(time.time()))+"\n")
	else:
		for i in range(len(rsi_list)):
			if (rsi_list[i]<target_down and rsi_list[i]>=0) or i==0:
				target_dict.update({name_to_code[code_list[i]]: rsi_list[i]})
		if len(target_dict) <= 1:
			print("no data")
			pass
		else:
			notify("Bot", "코인 감지")
			print("#########RSI "+str(target_down)+"미만 코인##########")
			print("#####Time unit : "+time_unit+" "+str(unit)+" #########\n")

			target_dict = sorted(target_dict.items(), key=operator.itemgetter(1))

			for i in target_dict:
			    print("코인:%s\tRSI:%d"%(i[0],i[1]))
			end = time.time() 
			print("\nRunning time : ", end-start)
			print("현재시간 : "+time.strftime('%c', time.localtime(time.time()))+"\n")



#Main function

if __name__ == "__main__":

	m = 0
	print("#########Analysis Start##########\n")
	code_list, name_to_code = market_code()
	while(1):
		# 1, 3, 5, 10, 15, 30, 60, 240
		try :
			# RSI_analysis(code_list,name_to_code,"minutes", 3)
			# if m%5 ==0:
			# 	RSI_analysis(code_list,name_to_code,"minutes", 15)
			# if m%20 ==0:
			# 	RSI_analysis(code_list,name_to_code,"minutes", 30)
			# 	RSI_analysis(code_list,name_to_code,"minutes", 60)
			# if m%30 ==0:	
				RSI_analysis(code_list,name_to_code,"minutes", 240, 70, 30, "down")
			# m += 1
		except:
			print('ERROR 발생')
			time.sleep(300)
	