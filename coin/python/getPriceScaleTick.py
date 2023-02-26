def get_price_scale_tick(_price):   
    if _price >= 2000000: 
        return [-3, 1000]
    elif _price >= 1000000: 
        return [-2, 500]
    elif _price >= 500000: 
        return [-2, 100]
    elif _price >= 100000: 
        return [-1, 50]
    elif _price >= 10000: 
        return [-1, 10]
    elif _price >= 1000: 
        return [-1, 5]
    elif _price >= 100: 
        return [0, 1]
    elif _price >= 10: 
        return [1, 0.1]
    elif _price >= 0: 
        return [2, 0.01]