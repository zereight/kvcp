const 티스토리_html템플릿만들기 = (props: {
  파트너스URL: string;
  썸네일URL: string;
}) => {
  const { 파트너스URL, 썸네일URL } = props;

  return `<script>setTimeout(() => {window.location.href='${파트너스URL}'},1000)</script>`;
};

export default 티스토리_html템플릿만들기;
