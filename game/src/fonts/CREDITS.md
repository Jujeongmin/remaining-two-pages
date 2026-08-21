# 실어 온 글꼴

## Nanum Myeongjo

| | |
|---|---|
| 만든 곳 | NHN Corporation |
| 허락 | SIL Open Font License 1.1 — [OFL.txt](OFL.txt) |
| 받은 곳 | [Google Fonts](https://github.com/google/fonts/tree/main/ofl/nanummyeongjo) |
| 파일 | `myeongjo-400.woff2` · `myeongjo-700.woff2` |

OFL 은 게임에 넣어 함께 배포하는 것을 허락한다. 팔아도 된다. 대신 글꼴만 따로 떼어
파는 것은 안 되고, 고쳐서 낼 때는 이름에 `Nanum` 을 못 쓴다. 여기서는 글자를 덜어 냈을
뿐이라 이름을 그대로 둔다 — 자르기는 OFL 이 말하는 개작에 들지 않는다.

## 왜 실어 오나

안 실으면 대부분 기기에 이 글꼴이 없어 **바탕**으로 떨어진다. 바탕은 인쇄용이라 화면
15px 에서 안티에일리어싱이 아예 안 걸리고(흐린 획 0), 가는 가로획이 통째로 사라진다.
안드로이드는 명조가 없어 serif 까지 밀린다. 글자가 안 읽힌다는 말이 여기서 나왔다.

먹이 얼마나 앉는지 재 본 값 (15px, 「두 장뿐이다. 앞에서 본 것과 옆에서 본 것.」):

```
바탕            진한 획 655   흐린 획   0   합  655
Nanum Myeongjo  진한 획 602   흐린 획 764   합 1366
```

## 어떻게 자르나

```bash
npm run build     # 먼저. 자를 글자를 빌드된 꾸러미에서 긁는다
npm run font
```

3MB 짜리 원본에서 게임이 쓰는 465 자만 남겨 76KB 로 만든다. 원본 ttf 는 `assets-src/font/`
에 있고 저장소에는 안 들어간다.

**말을 늘렸으면 다시 돌릴 것.** 안 돌리면 새로 쓴 글자가 이 글꼴에 없어 그 글자만
딴 글꼴로 뜬다.
