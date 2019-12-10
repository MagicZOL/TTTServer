# TTTServer

본격 모바일 멀티플레이 Tic Tac Toe 게임

**Nodejs를 이용한 Tic Tac Toe 게임 서버 입니다.**<br>
**데이터베이스는 mongoDB를 사용하였습니다.**<br>

# 서버 사용방법                                                                                                                                                             
## 회원가입
신규유저 등록
### 요청
> [POST] /users/singup

전달값
<pre>
{
  'username' : 'hongildong',
  'password' : 'hong1234',
  'name' : '홍길동'
}
</pre>
form-data 샘플

|키|값|
|---|---|
|username|hongildong|
|password|hong123|
|name|홍길동|
### 결과

## 로그인
### 요청

### 결과
