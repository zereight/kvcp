Pipeline 3. 어떻게 프로세스를 예상하는가?

1. 네이버 쇼핑 BEST 목록 가져오기
   네이버 쇼핑 BEST목록 API 필요.
   (한번 올린거 중복해도되려나?)

2. 구글 엑셀 스프레드 시트에 등록 (생략가능? 로컬만 할때는 json으로도 가능)
   구글 엑셀 API 필요.

3. 쿠팡 파트너스 링크 자동생성 / 상품명 / 상품설명
   쿠팡 파트너스 API는 누적판매가 15만원이상이고 최종승인이 되어야 발급가능하다.
   "이 포스팅은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다." 문구 표기필요.

4. 카카오뷰 쇼핑전용 개인채널에 아침/점심/저녁/밤에 5개씩 자동예약등록
   (하루에 1일씩 자동배치돌리거나 한달치 돌려도 될거같은..)

   카테고리는 쇼핑 정보, 리빙으로 선택.

   1day = 20개, 3년뒤 약 20000개
   비슷한 채널 3~4개 똑같이 운영

   사실상 카카오뷰는 카카오계열 링크없으면 노출 잘 안시켜줄거고
   제목이 어그로를 끌지못하면, 클릭율이 되게 낮을것을 감안해야함.

   하지만 프로그램을 통한 물량과 꾸준함으로 가능성이 있다고 판단.

# 우선순위

- [x] 카카오뷰 등록 API 로직 먼저 구현
- [x] 쿠팡 상품 크롤러 개발, json으로 저장
- [x] 카카오뷰 채널 다수 생성해서, 링크 뿌리기
- [ ] 에약발행한거는 json에서 지우는것도 자동화하면 좋을듯
- [ ] 쇼핑광고적인 문구를 만들어내는 ai도 자동화하기

### 이 방법의 문제점. 카카오뷰 노출 수위가 낮은 편임

---

- [ ] 뉴스픽으로 자동화 해볼까?

---

- [ ] 트위터짤들 카카오뷰에 이슈에 넣기
