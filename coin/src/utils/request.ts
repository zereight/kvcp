type Method = "GET" | "POST";

interface FetchProps {
  url: string;
  options?: {
    method?: Method;
    header?: {
      [key in string]: string;
    };
    body?: string;
  };
}

interface GetRequestProps {
  url: string;
  header?: {
    [key in string]: string;
  };
}

interface PostRequestProps extends GetRequestProps {
  body?: string;
}

const _request = ({ url, options }: FetchProps) => fetch(url, options);

const request = {
  get: ({ url, header }: GetRequestProps) =>
    _request({
      url,
      options: {
        method: "GET",
        header
      }
    }),
  post: ({ url, header, body }: PostRequestProps) =>
    _request({
      url,
      options: {
        method: "POST",
        header,
        body
      }
    })
};

export default request;
