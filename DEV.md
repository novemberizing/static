NOVEMBERIZING'S STATIC DEV
==========================

### 개발환경에서 테스트하기

```sh
docker run -itd --rm -p 8090:80 --name nginx -v ${PWD}\docs:/usr/share/nginx/html:ro -d nginx
```


### Static 로 정적 페이지를 생성하기

```sh
npx novemberizing-static-gen --theme="static" --destination="docs"
```
