# 그림 주문서 — 남은 두 장

게임 톤: **낡은 종이 위의 먹선**. 세피아·황토·먹 세 가지로만 간다. 원색을 넣으면 도면과 자재가
묻힌다. 인물은 배경 없이 반신으로 뽑아, 화면 아래 대화창에 얹는다.

넣을 자리와 개수:

| 쓰임 | 파일 | 크기 | 개수 |
|---|---|---|---|
| 도편수 — 대화 상대 | `game/public/art/master-{calm,pleased,stern}.png` | 1024×1024, 배경 투명 | 3 |
| 견습 — 플레이어 | `game/public/art/apprentice.png` | 1024×1024, 배경 투명 | 1 |
| 타이틀 삽화 | `game/public/art/title.png` | 1600×900, 배경 있음 | 1 |

---

## 0-1. 파일 형식 — **webp 로 넣는다**

게임이 쓰는 그림은 전부  다. PNG 로 받아서 그대로 넣으면
용량이 네 배가 된다(10.2MB → 2.7MB 로 줄었다).

새 그림을 PNG 로 받았으면 그대로 주면 된다. 이쪽에서 webp 로 바꿔 넣는다.
비치는 부분(투명)도 그대로 살아 있다.

스토어에 올릴 그림만 PNG 다 —  아래에 있고 게임에 딸려 가지 않는다.

---

## 0. 공통 화풍 블록 (모든 프롬프트 앞에 그대로 붙일 것)

일관성은 이 문단을 **글자 하나 바꾸지 않고** 재사용하는 데서 나온다.

```
Korean ink-wash painting (수묵화) crossed with technical draftsmanship. Confident dry-brush
outlines in charcoal black over soft sepia washes. Aged mulberry-paper texture visible through
the wash, faint foxing and fiber grain. Strictly limited palette: ink black, warm sepia, ochre,
raw umber, one sparing accent of oxidized red seal-ink. No saturated colors, no gradients from
digital airbrush, no cel-shading. Flat even lighting, no dramatic rim light. Late-Joseon Korean
setting, carpenters' guild. Hand-drawn feel, slight line wobble, visible brush pressure.
```

**네거티브** (지원하는 도구에서는 전부 넣을 것)

```
anime, manga, chibi, big glossy eyes, cel shading, 3D render, CGI, plastic skin, neon,
saturated colors, blue/green/purple tint, modern clothing, Japanese kimono, Chinese hanfu,
samurai, ninja, watermark, signature, text, logo, frame, border, busy background, lens flare,
bokeh, photorealistic
```

---

## 1. 도편수 (都片手) — 대화 상대

의뢰를 주고 검수를 매기는 늙은 목수. 말수 적고, 칭찬은 짧다.

### 1-1. 평상 `master-calm.png`

```
[공통 화풍 블록]

Half-body portrait of a Korean master carpenter in his sixties, three-quarter view facing
slightly to the viewer's right, eyes level with the viewer. Weathered square face, deep
crow's feet, short cropped white beard, gray hair pulled into a topknot under a black
horsehair headband (manggeon). Undyed hemp jeogori with sleeves rolled to the elbow,
forearms corded with old muscle, a worn leather carpenter's apron over it. A wooden ink-line
pot (먹통) hangs at his hip on a cord; a split bamboo measuring rule is tucked in the apron.
Ink stains on his thumb and forefinger. Expression: neutral, appraising, mouth a flat line,
not unkind. Arms relaxed at his sides.

Bust framing, head and shoulders and upper chest only, cut off at the ribs.
Fully transparent background, no floor, no shadow cast on any surface.
```

### 1-2. 흡족 `master-pleased.png`

같은 인물, 표정만. 앞 문단을 그대로 두고 `Expression:` 문장만 아래로 바꾼다.

```
Expression: the barest smile, one eyebrow lifted, a slow nod caught mid-motion. Eyes
crinkled. Still not effusive — a man who considers "not bad" high praise.
```

### 1-3. 못마땅 `master-stern.png`

```
Expression: brow drawn down, lips pressed, chin tucked. Looking at something just past the
viewer's shoulder as if checking a joint that does not sit flush. Disappointed, not angry.
```

> **표정 3종 뽑는 법** — 같은 시드로 `Expression:` 문장만 갈아 끼운다. 도구가 시드를 안 받으면
> 평상 한 장을 먼저 뽑고 그것을 참조 이미지(image-to-image, denoise 0.35~0.45)로 넣어
> 나머지 둘을 뽑는다. 얼굴이 흔들리면 아무리 잘 그려도 다른 사람으로 보인다.

---

## 2. 견습 복원공 — 플레이어 (남·여 두 벌)

이 사람이 곧 쓰는 사람이다. 타이틀 화면에 늘 서 있고, 판을 맺을 때마다 한 마디씩 한다.
**게임을 처음 켜면 남녀 중에 고르게 된다.** 그래서 같은 표정을 두 벌 받아야 한다.

파일 이름에 `m`(남) / `f`(여) 가 들어간다. 고른 쪽에 맞춰 코드가 알아서 골라 쓴다.

| 표정 | 남 | 여 |
|---|---|---|
| 기본 | `apprentice-m.png` ✔ 들어옴 | `apprentice-f.png` |
| 각오 | `apprentice-m-determined.png` | `apprentice-f-determined.png` |
| 난감 | `apprentice-m-worried.png` | `apprentice-f-worried.png` |
| 환함 | `apprentice-m-bright.png` | `apprentice-f-bright.png` |
| 깨달음 | `apprentice-m-surprised.png` | `apprentice-f-surprised.png` |
| 지침 | `apprentice-m-tired.png` | `apprentice-f-tired.png` |

> 한쪽만 넣어도 게임은 돈다. 없는 표정은 그림 없이 이름과 말만 뜬다.
> 다만 **기본 두 장(`-m`, `-f`)은 둘 다 있어야** 고르개에 얼굴이 뜬다.

### 2-1. 남 `apprentice-m.png` — 이미 들어옴

도면 두 장을 낀 채 골똘한 얼굴. **다시 뽑지 말 것.** 남자 표정 다섯 장은 이 그림을
참조 이미지로 넣어 뽑는다.

```
[공통 화풍 블록]

Half-body portrait of a young Korean man in his early twenties, an apprentice draftsman,
three-quarter view facing slightly to the viewer's left. Hair tied back short and
practical, a few strands loose. Plain undyed hemp jeogori, sleeves pushed up, a smudge of
ink on one cheekbone and black-stained fingertips. Two large rolled paper drawings clamped
under one arm, their edges scorched brown and curling — the only two sheets that survived a
fire. Expression: absorbed, brow faintly furrowed, looking slightly off-axis as if solving
something in the air.

Bust framing, head and shoulders and upper chest only, cut off at the ribs.
Fully transparent background, no floor, no shadow cast on any surface.
```

### 2-2. 여 `apprentice-f.png` — 새로 뽑을 것

**같은 사람의 다른 판본이 아니라, 같은 자리에 선 다른 사람이다.** 옷·먹 자국·도면 두 장은
똑같이 두고 사람만 바꾼다. 그래야 대사가 어느 쪽에 붙어도 어색하지 않다.

```
[공통 화풍 블록]

Half-body portrait of a young Korean woman in her early twenties, an apprentice draftswoman,
three-quarter view facing slightly to the viewer's left. Her hair is gathered into a single
long braid falling over one shoulder, a few strands loose at the temples, tied with a plain
cloth band. Plain undyed hemp jeogori, sleeves pushed up to the elbow, a smudge of ink on one
cheekbone and black-stained fingertips. Two large rolled paper drawings clamped under one
arm, their edges scorched brown and curling — the only two sheets that survived a fire.
Expression: absorbed, brow faintly furrowed, looking slightly off-axis as if solving
something in the air.

She is a working craftswoman, not a court lady: practical clothes, no jewelry, no makeup,
no hair ornaments. Same worn workshop clothing as the rest of the guild.

Bust framing, head and shoulders and upper chest only, cut off at the ribs.
Fully transparent background, no floor, no shadow cast on any surface.
```

여자 쪽 네거티브에는 이 줄을 **더 넣는다**:

```
hanbok gown, court dress, jewelry, hair ornament, binyeo, makeup, lipstick, glamour,
cleavage, fan service, idol face
```

### 2-3. 표정 다섯 장 (남·여 각각)

각자의 기본 그림 문단을 **그대로 두고** `Expression:` 문장만 갈아 끼운다.
도면을 낀 자세와 머리 모양도 그대로 둔다.

| 표정 | 언제 나오는가 |
|---|---|
| 각오 | 프롤로그 끝, 의뢰를 받을 때, 끝없이 풀기 시작 |
| 난감 | 프롤로그 앞머리, 어려운 의뢰를 받을 때, 검수 병 |
| 환함 | 검수 갑, 의뢰 완성 |
| 깨달음 | 연습판에서 규칙을 깨달을 때 |
| 지침 | 끝없이 풀기를 접을 때 |

- **각오** `-determined`
  ```
  Expression: jaw set, chin slightly raised, meeting the viewer's eyes straight on for once.
  Not bravado — the quiet look of someone who has decided to try anyway.
  ```
- **난감** `-worried`
  ```
  Expression: brows drawn up in the middle, lower lip caught between the teeth, eyes cast
  down and to the side at the drawings under the arm. Out of their depth and knowing it.
  ```
- **환함** `-bright`
  ```
  Expression: a wide unguarded smile, eyes crinkled almost shut, head tilted back a little.
  The relief of something finally standing up straight.
  ```
- **깨달음** `-surprised`
  ```
  Expression: eyes gone wide, eyebrows up, mouth parted mid-word, one hand half-raised as if
  about to point at the thing just understood. Caught in the moment it clicks.
  ```
- **지침** `-tired`
  ```
  Expression: eyelids heavy, shoulders dropped, wiping the forehead with the back of one
  ink-stained wrist. Worn out but not unhappy.
  ```

> **다섯 장이 같은 사람으로 보이게 하는 법** — 그쪽 기본 그림(`apprentice-m.png` 또는
> `apprentice-f.png`)을 참조 이미지로 넣고
> (image-to-image, denoise 0.35~0.45) `Expression:` 만 바꾼다. 시드를 받는 도구라면 시드도
> 고정한다. 머리 모양·먹 자국 위치·옷깃이 흔들리면 다른 사람이 된다.
>
> **크기** — 1024 정사각, 배경 투명. 대화창에서 세로 130~190px 로 들어가므로 그 크기에서
> 표정이 읽혀야 한다. 뽑은 그림을 150px 로 줄여 보고 눈매가 뭉개지면 얼굴을 더 크게 잡는다.

---

## 3. 타이틀 삽화 `title.png`

글자는 넣지 말 것. 제목은 코드가 얹는다.

```
[공통 화풍 블록]

Wide horizontal composition. The burnt-out drafting room of a carpenters' guild at dawn.
Charred plan chests, curled black flakes of ruined drawings drifting in the still air, a
collapsed shelf, thin smoke. Cold morning light falls through a broken lattice window onto a
low desk at the right, where exactly two sheets of paper have survived, weighted flat by a
stone. On those two sheets: simple orthographic line drawings — one front elevation, one side
elevation — of the same small building, drawn as clean grids of filled and empty squares.
Everything else in the room is ash and ruin; those two sheets are the only clean, bright thing
in the frame.

No people in the frame. No text, no letters, no numerals anywhere in the image.
Leave the upper-left third visually calm and uncluttered — the game title will be placed there.
```

---

## 4. 받은 뒤 할 일

1. 파일을 `game/public/art/` 에 위 이름 그대로 넣는다.
2. 인물은 **1024 정사각, 배경 투명 PNG**. 배경이 남아 있으면 종이 바탕과 겹쳐 네모가 드러난다.
   투명이 안 나오면 흰 배경으로 받아 배경을 지운 뒤 넣는다.
3. 인물은 화면 아래 대화창 왼쪽에 세로 96~140px 로 들어간다. **그 크기에서 얼굴이 읽혀야 한다.**
   뽑은 그림을 120px 로 줄여 보고, 눈코입이 뭉개지면 얼굴을 더 크게 잡아 다시 뽑는다.
4. 타이틀 삽화는 1600×900 안팎. 세로 화면에서는 위아래가 잘리므로 가운데에 중요한 것을 둔다.

파일이 없어도 게임은 그대로 돈다. 대화창은 그림 없이 이름과 말만 띄우고, 그림이 들어오면
그 자리에 얹힌다.

---

# 다음에 뽑을 것 (급한 순서)

인물 넉 장은 들어왔다. 아래는 **게임이 눈에 띄게 좋아지는 순서**로 적었다.
1번은 작고 싸면서 효과가 크고, 2번은 가장 크게 달라지는 자리다.

## 1. 검수 도장 3종 (가장 급함)

판을 맺으면 뜨는 창에 등급이 글자로만 찍힌다. 여기에 붉은 낙관이 쾅 찍히면 손맛이 산다.

| 파일 | 크기 | 쓰임 |
|---|---|---|
| `game/public/art/seal-gap.png` | 512×512, 배경 투명 | 검수 갑 |
| `game/public/art/seal-eul.png` | 512×512, 배경 투명 | 검수 을 |
| `game/public/art/seal-byeong.png` | 512×512, 배경 투명 | 검수 병 |

```
[공통 화풍 블록]

A single traditional Korean seal impression (낙관) stamped in cinnabar red ink on nothing —
the stamp mark alone, no paper, no background. A squarish seal outline with the Hanja
character 甲 carved inside in seal script (전서체), rendered as the character would appear
pressed by hand: ink dense at the edges, patchy and broken in the middle, one corner
lifting where the stamp did not fully meet the paper. Slightly rotated, about 8 degrees
counter-clockwise. Cinnabar red only — no other color.

Fully transparent background. No paper texture behind the stamp, no drop shadow, no frame.
```

나머지 둘은 한자만 바꾼다. `乙` (을), `丙` (병).
병은 **더 흐리고 더 많이 깨지게** 하려면 이 줄을 덧붙인다:
`The impression is weak and uneven, as if stamped without conviction.`

## 2. 의뢰 완성 삽화 4종 (효과 가장 큼)

의뢰 다섯 판을 다 맺으면 일지가 흐른다. 지금은 글만 있다. 여기에 **세운 건물 그림**이
한 장 뜨면 다섯 판을 푼 값이 눈에 보인다.

| 파일 | 크기 |
|---|---|
| `game/public/art/job-warehouse.png` (창고) | 1280×720, 배경 있음 |
| `game/public/art/job-belltower.png` (종탑) | 1280×720 |
| `game/public/art/job-bridge.png` (돌다리) | 1280×720 |
| `game/public/art/job-gate.png` (성문) | 1280×720 |

창고:
```
[공통 화풍 블록]

A newly rebuilt Korean timber-frame storehouse standing complete in an empty yard at dusk,
seen in three-quarter view. Fresh pale timber against the older grey of the surrounding
village wall. Wood shavings and offcuts still scattered at its base, a ladder leaning where
it was left. Nobody in the frame. Quiet, finished, slightly proud.

No text, no letters, no numerals anywhere in the image.
```

나머지 셋은 가운데 문단만 갈아 끼운다:

- **종탑** — `A newly rebuilt Korean bell tower, two tiers, the bronze bell hung but silent, seen from below at a slight angle against an early morning sky.`
- **돌다리** — `A newly finished Korean stone arch bridge over a shallow river, its single arch reflected in the water, morning mist on the far bank.`
- **성문** — `A rebuilt Korean fortress gate with an arched stone passage and a wooden gatehouse above, both doors standing open, seen straight on from outside at dawn.`

## 3. 힌트 아이콘

힌트가 지금 글자뿐이다. 버튼과 상점에 쓸 작은 그림.

```
[공통 화풍 블록]

A single torn fragment of an old architectural drawing — one scrap of mulberry paper with
charred, curling edges, a few surviving grid lines and part of an elevation drawn in ink
across it. Lying flat, seen from directly above. Nothing else.

Fully transparent background. 256x256. No text, no numerals.
```
→ `game/public/art/shard.png`

## 4. 도편수 표정 두 장 더

지금 셋(평상·흡족·못마땅)으로 돌아가지만, 가르치는 자리와 놀라는 자리가 따로 있으면
연습판과 갑 판정이 더 살아난다. 1-1 문단에서 `Expression:` 만 갈아 끼운다.

- `master-pointing.png` — `Expression: mid-explanation, mouth slightly open, one weathered hand raised into frame pointing at something off to the side. Patient, not condescending.`
- `master-surprised.png` — `Expression: eyebrows up, chin drawn back, genuinely caught off guard. The look of a man who did not expect this to be done well.`

## 5. 나중에

- **의뢰인 3~4명** — 의뢰마다 다른 사람(마을 이장, 절의 노승, 나루터 사공, 성문 수문장).
  서사를 한 겹 더 얹을 때.
- **부지 바닥 종이 무늬** — 지금은 민 종이색이다. 결이 있으면 더 도면답다.
- **밀린 의뢰 배경** — 쌓인 서류 더미. 끝없는 모드 화면에.

---

## 6. 종이 질감 타일 (톤이 가장 크게 오름)

지금 바탕은 민 종이색 한 겹이다. 결이 깔리면 화면 전체가 단번에 도면다워진다.
**이어 붙여도 자국이 안 나야 한다.** 여기서 실패하면 화면에 격자 무늬가 비친다.

```
[공통 화풍 블록]

A seamless tileable texture of aged Korean mulberry paper (한지). Visible long fibers
suspended in the sheet, faint foxing spots, subtle mottling from age, one or two soft creases.
Very low contrast — this sits behind text and must never compete with it. Warm pale sand tone
throughout, no dark areas, no vignette, no border, no lighting gradient.

The image must tile seamlessly: edges wrap on all four sides with no visible seam.
Flat, evenly lit, shot straight on. 512x512. No objects, no drawings, no text.
```
→ `game/public/art/paper.png` (512×512, 불투명)

## 7. 조작 아이콘 한 벌

버튼이 지금 글자뿐이다. 좁은 화면에서 글자가 접히는 자리가 있고, 아이콘이 붙으면
읽지 않고도 손이 간다. **여섯 장을 한 번에, 같은 굵기로** 뽑아야 한 벌로 보인다.

```
[공통 화풍 블록]

A set of six simple pictograms drawn as if brushed with a fine ink pen on paper, all in one
consistent line weight, all fitting the same square. Flat black ink only, no fill, no color,
no circles or frames around them. Left to right:
(1) a curved arrow turning back on itself — undo
(2) a broom sweeping a flat surface clean — reset
(3) a torn scrap of drawing paper — hint
(4) an eye with a small orbit arc around it — reset viewpoint
(5) a cube with a circular arrow around its vertical axis — rotate
(6) a bell with a stroke through it — mute

Arrange them in a single horizontal row, evenly spaced, on a fully transparent background.
No text, no numerals, no labels.
```
→ `game/public/art/icons.png` (한 줄 6칸, 1536×256, 배경 투명). 받으면 코드에서 잘라 쓴다.

## 8. 스토어 썸네일 — 이미 만들어 두었다

`game/public/art/store-thumb.png` — 512×512. **이미 있다.**

있는 그림 셋을 겹쳐 만들었다 — 불탄 도면실(`title.png`) 위에 견습 복원공
(`apprentice-f.png`)을 크게 세우고, 아래쪽 먹빛 띠에 제목, 오른쪽 위에 검수 갑
도장(`seal-gap.png`). 새로 그린 것은 없다.

작은 딱지로 줄었을 때 남는 것은 얼굴과 제목뿐이므로 얼굴을 위쪽 삼분의 일에 두고
제목을 크게 잡았다. 부제는 두지 않았다 — 128px 로 줄면 아무도 못 읽는다.

아래 프롬프트는 **아예 새로 그릴 때만** 쓴다.

```
[공통 화풍 블록]

Square composition. Two sheets of old drawing paper lying side by side on a dark worn desk,
seen from directly above, each weighted flat by a small stone. On the sheets: simple
orthographic line drawings in ink — one front elevation, one side elevation of the same small
Korean timber building, drawn as clean grids of filled and empty squares. The two sheets fill
more than half the frame. Around them, charred wood fragments and ash at the edges of the desk.

The drawings must stay crisp and readable when the image is shrunk to a small icon.
No text, no letters, no numerals anywhere in the image.
```

배너와 스크린샷은 지금 필요 없다. 스크린샷이 필요해지면 실제 화면을 찍어서 주겠다.

---

# 지금까지 들어온 것

| 항목 | 상태 |
|---|---|
| 도편수 평상·흡족·못마땅 | 붙음 — 대화창, 검수 창 |
| 도편수 설명 중(pointing) | 붙음 — 연습판 설명 |
| 도편수 놀람(surprised) | 붙음 — 검수 갑 |
| 견습 | 붙음 — 대화창 |
| 타이틀 삽화 | 붙음 — 타이틀 배경 |
| 검수 도장 갑·을·병 | 붙음 — 판 맺는 창 |
| 의뢰 완성 삽화 4종 | 붙음 — 의뢰 다섯 판 다 맺으면 |
| 힌트 조각(shard) | 붙음 — 힌트 단추 아이콘 |
| 종이 질감 · 조작 아이콘 · 썸네일 | 아직 |

받은 그림은 전부 줄여서 넣었다. 원본은 `assets-src/art-original/` 에 그대로 있다. public/ 바깥이라 빌드에 안 딸려 간다.

---

## 9. 판 딱지 20장 (판 고르기 화면)

판 고르기 화면에서 **그림을 보고 고르게** 한다. 맺은 판에는 그 그림 위에 검수 도장이
비뚜름하게 찍힌다. 목록만 훑어도 어디까지 왔는지 한눈에 보인다.

넣을 곳: `game/public/art/stage/s1.png` … `s20.png`
크기: **512×512, 배경 있음.** 화면에서는 104~160px 짜리 딱지로 줄어든다.

> **작게 줄어든다는 것을 잊지 말 것.** 한 딱지에 물건 하나만 크게 넣는다. 멀리 있는 풍경,
> 자잘한 소품, 여러 개가 흩어진 구도는 100px 에서 전부 뭉개진다. 아래 프롬프트가 물건을
> 화면 가운데 크게 두라고 못박아 둔 이유다.

### 공통 문단

```
[공통 화풍 블록]

A single Korean traditional building component, drawn as one clear object filling most of the
square frame, seen in three-quarter view against a plain aged-paper background. Freshly cut
pale timber or dressed stone, joinery visible. A few wood shavings or chips at its base.
Nothing else in the frame — no landscape, no people, no tools scattered around.

The object must stay readable when the image is shrunk to a 100px thumbnail: one large
subject, strong silhouette, high contrast against the background.
Square composition. No text, no letters, no numerals anywhere in the image.
```

### 20장의 물건

`A single Korean traditional building component` 자리에 아래를 넣는다.

**창고**
| 파일 | 물건 | 영어 |
|---|---|---|
| `s1.png` | 주춧돌 | a single squared foundation stone (초석) for a timber column, freshly dressed |
| `s2.png` | 기둥 | a single round timber column standing upright on its foundation stone |
| `s3.png` | 문틀 | a wooden door frame assembled and standing on its own |
| `s4.png` | 지붕 뼈대 | a bundle of roof rafters laid in a row, seen from the eave end |
| `s5.png` | 지붕 | a tiled roof section with layered grey roof tiles and a curved eave |

**종탑**
| 파일 | 물건 | 영어 |
|---|---|---|
| `s6.png` | 돌계단 | a short flight of dressed stone steps |
| `s7.png` | 창살 | a latticed wooden window panel |
| `s8.png` | 종 받침 | a heavy timber bell frame, empty, waiting for its bell |
| `s9.png` | 처마 | a projecting eave corner with bracket sets (공포) underneath |
| `s10.png` | 꼭대기 | a roof finial ornament (절병통) at the very top of a tower |

**돌다리**
| 파일 | 물건 | 영어 |
|---|---|---|
| `s11.png` | 다리 받침 | a stone bridge abutment block set into the bank |
| `s12.png` | 아치 돌 | a stone arch ring, its voussoirs fitted together |
| `s13.png` | 가로 돌 | a long stone cross-beam resting on two piers |
| `s14.png` | 바닥 돌 | a flat stone bridge deck slab |
| `s15.png` | 난간 | a stone balustrade section with turned posts |

**성문**
| 파일 | 물건 | 영어 |
|---|---|---|
| `s16.png` | 성벽 | a section of fitted stone fortress wall |
| `s17.png` | 바깥 성벽 | a curved barbican wall seen from above at an angle |
| `s18.png` | 성문 누각 | a small wooden gate pavilion with a tiled roof |
| `s19.png` | 아치 문 | a stone arched gateway opening |
| `s20.png` | 망루 | a two-tier watchtower |

### 급하지 않다면

20장이 부담스러우면 **창고 다섯 장(`s1`~`s5`)만 먼저** 넣어도 된다. 나머지는 그림 없이
지금처럼 이름과 자재 수만 나오고, 파일을 넣는 대로 하나씩 딱지가 된다.

---

## 10. 자재 겉면 무늬 (지금은 코드로 그리고 있음 — 급하지 않음)

부지에 세우는 자재는 지금 **코드가 직접 그린다.** 면마다 밝기를 달리하고, 결 선을 세 줄씩
긋고, 자리마다 나무색을 세 벌 중 하나로 골라 똑같아 보이지 않게 해 두었다. 에셋 없이도
나무로 읽힌다. 아래는 **더 밀고 싶을 때만** 쓴다.

`game/public/art/wood-top.png` · `wood-side.png` — 각 256×256, 이어 붙여도 자국 없을 것.

```
[공통 화풍 블록]

A seamless tileable texture of freshly sawn pine timber, seen straight on from above.
Pale warm wood, straight parallel grain lines running from edge to edge in one direction,
one or two small dark knots, faint saw marks across the grain. Low contrast — this will be
tinted and shaded by the game, so it must not carry its own lighting.

Flat, evenly lit, no shadows, no perspective, no background. The image must tile seamlessly:
grain lines and color must wrap on all four sides. 256x256. No text, no numerals.
```

- `wood-top.png` — 위 그대로 (마구리가 아닌 널면)
- `wood-side.png` — 같은 문단에서 `running from edge to edge in one direction` 을
  `running vertically from top edge to bottom edge` 로 바꾼다

> 받으면 SVG `<pattern>` 으로 면마다 나눠 붙인다. 다만 **정육면체 예순네 개에 무늬를 넣으면
> 화면이 어지러워질 수 있다.** 지금의 결 선 세 줄이 그 아슬아슬한 선을 지키고 있는 것이라,
> 넣어 보고 오히려 시끄러우면 되돌리는 편이 낫다.

---

## 11. 캐릭터 그림 9장 (판을 맺는 창용)

판을 맺으면 뜨는 창에는 그림이 **작게** 들어간다(70~85px). 반신 그림을 그 크기로 줄이면
얼굴이 뭉개져서 누가 무슨 표정인지 안 보인다. 그래서 **작게 봐도 읽히는 캐릭터 그림**을
따로 둔다. 몸을 줄이고 머리를 키운 비례라야 작은 자리에서 표정이 산다.

넣을 곳: `game/public/art/`
크기: **512×512, 배경 투명.**

| 파일 | 누구 | 언제 |
|---|---|---|
| `chibi-master-pleased.png` | 도편수 | 검수 갑 |
| `chibi-master-calm.png` | 도편수 | 검수 을 |
| `chibi-master-stern.png` | 도편수 | 검수 병 |
| `chibi-m-bright.png` / `chibi-f-bright.png` | 견습 남 / 여 | 검수 갑, 의뢰 완성 |
| `chibi-m-plain.png` / `chibi-f-plain.png` | 견습 남 / 여 | 검수 을 |
| `chibi-m-down.png` / `chibi-f-down.png` | 견습 남 / 여 | 검수 병, 지쳤을 때 |

> **없어도 그대로 돈다.** 없으면 지금처럼 반신 그림이 작게 들어가고, 그것도 없으면 말만 남는다.
> 도편수 3장만 먼저 넣어도 되고, 한쪽 성별만 먼저 넣어도 된다.

### 공통 화풍 (이 문단은 0번 블록 **대신** 쓴다)

캐릭터 그림만은 화풍이 다르다. 수묵 반신화와 같은 붓질로 그리면 작게 줄였을 때 뭉개진다.

```
Clean cel-shaded character sticker in a soft anime style, drawn with a confident even
outline. Two-head-tall (chibi) proportions: large head, small compact body, simple hands.
Big readable eyes, simple nose and mouth. Flat color fills with one soft shadow tone —
no gradients, no rendering, no texture.

Palette stays in the game's range: undyed hemp cream, warm sepia, raw umber, charcoal ink
outline, one small accent of oxidized red. Late-Joseon Korean workshop clothing.

Full body, standing, centered in the square with a little margin on all sides.
Fully transparent background. No text, no frame, no shadow on the ground.
```

**네거티브**

```
photorealistic, painterly, ink wash, watercolor texture, gradient shading, 3D render,
saturated neon colors, modern clothing, kimono, hanfu, watermark, signature, text, frame,
cropped limbs, cut off at the edge
```

### 사람별 문단

위 공통 문단 뒤에 하나만 붙인다.

- **도편수** — `An old Korean master carpenter: white beard, grey topknot under a black horsehair headband, undyed hemp jeogori with rolled sleeves, worn leather apron, a wooden ink-line pot at his hip.`
- **견습 남** — `A young Korean man, an apprentice: hair tied back short, a smudge of ink on one cheek, plain undyed hemp jeogori with rolled sleeves, two rolled drawings under one arm.`
- **견습 여** — `A young Korean woman, an apprentice: a single long braid over one shoulder, a smudge of ink on one cheek, plain undyed hemp jeogori with rolled sleeves, two rolled drawings under one arm. A working craftswoman — no jewelry, no makeup, no hair ornaments.`

### 표정 문단

사람 문단 뒤에 `Pose and expression:` 한 줄만 갈아 끼운다.

| 이름 | 문장 |
|---|---|
| `pleased` | `Pose and expression: arms folded, a small satisfied nod, eyes crinkled shut.` |
| `calm` | `Pose and expression: standing straight, neutral face, one hand behind the back.` |
| `stern` | `Pose and expression: brow lowered, arms folded tight, mouth a flat line.` |
| `bright` | `Pose and expression: both arms up in a small cheer, wide open smile, eyes shut with joy.` |
| `plain` | `Pose and expression: standing straight, small polite smile, hands at the sides.` |
| `down` | `Pose and expression: shoulders dropped, head tilted down, one hand scratching the back of the head.` |

도편수는 `pleased` · `calm` · `stern`, 견습은 `bright` · `plain` · `down` 을 쓴다.

---

## 12. 단추와 창 껍데기 (지금 제일 밋밋한 곳)

지금 단추와 창은 **색 한 겹 + 먹선 2px** 뿐이다. 화면 어디를 봐도 같은 네모라 눈이 쉴
자리가 없다. 여기만 갈면 그림을 한 장도 안 바꾸고 화면이 통째로 달라진다.

### 12.0 이 절만의 규칙 — 늘었다 줄었다 하는 그림

단추는 말에 따라 너비가 다르다(`되돌리기` ↔ `Undo` ↔ `復原`). 그래서 **한 장을 아홉 조각으로
잘라 쓴다**(CSS `border-image`). 네 귀퉁이는 그대로 두고, 네 변과 가운데만 늘려서 어떤 너비에도
맞춘다. 그리는 쪽에서 지킬 것은 셋뿐이다.

1. **네 귀퉁이 안쪽에만 무늬를 둔다.** 잘라 낼 자리(아래 `자름` 값) 바깥으로 무늬가 걸치면
   늘였을 때 그 무늬가 뭉개져 늘어난다.
2. **네 변의 가운데는 옆으로 이어 붙여도 티가 안 나야 한다.** 결이나 못은 귀퉁이 쪽에만.
3. **가운데는 거의 비워 둔다.** 글자가 그 위에 얹힌다. 아주 옅은 결 정도만.

배경은 전부 **투명 PNG**. 그림자는 넣지 말 것(CSS 로 얹는다).

| 파일 | 크기 | 자름 | 쓰임 |
|---|---|---|---|
| `ui/btn.png` | 192×64 | 20 | 보통 단추 |
| `ui/btn-on.png` | 192×64 | 20 | 눌렸을 때 · 손 얹었을 때 |
| `ui/btn-primary.png` | 192×64 | 20 | `검수 올리기` 하나뿐 |
| `ui/chip.png` | 96×48 | 14 | 층 고르개 (안 고른 것) |
| `ui/chip-on.png` | 96×48 | 14 | 층 고르개 (고른 것) |
| `ui/panel.png` | 256×256 | 44 | 창 테두리 (검수·규칙·설정·등수) |
| `ui/ribbon.png` | 320×72 | 24 | 창 제목 밑에 까는 띠 |
| `ui/divider.png` | 512×24 | — | 가로 구분선 (늘리지 않고 가운데만 늘림) |
| `ui/slider-track.png` | 64×24 | 10 | 소리 크기 홈 |
| `ui/slider-thumb.png` | 48×56 | — | 소리 크기 손잡이 (안 늘림) |

전부 `game/public/art/ui/` 에 넣으면 된다.

---

### 12.1 보통 단추 `ui/btn.png`

```
[공통 화풍 블록]

A single rectangular wooden name-plaque from a Korean carpenters' workshop, drawn head-on,
filling the whole frame edge to edge with no margin. Planed pale wood with faint straight
grain running left to right. A thin brushed ink border traced just inside the edge, its line
wobbling slightly like a hand-drawn rule. At each of the four corners, one small dark iron
tack. The centre of the plaque is nearly empty — bare wood, only the faintest grain — because
words will be written across it later.

Keep every tack and every corner detail well inside the outer 20 pixels of each edge. The
middle third of each edge must be plain, so it can be stretched and repeated seamlessly.
Fully transparent background outside the plaque. No text, no letters, no numerals, no drop
shadow, no perspective, no rounded corners.
```

### 12.2 눌린 단추 `ui/btn-on.png`

**같은 판을 그대로 두고 색만 뒤집는다.** 위 프롬프트 뒤에 이어 붙일 것:

```
This time the plaque is inked dark: the wood is stained deep charcoal-brown as if soaked,
the border line and the tacks now read as light bare wood against it. Same shape, same size,
same tack positions, same grain direction — only the value is inverted.
```

### 12.3 검수 올리기 단추 `ui/btn-primary.png`

이 게임에서 손이 마지막으로 가는 자리다. 다른 단추와 한눈에 갈려야 한다.

```
[공통 화풍 블록]

A single rectangular plaque filling the whole frame edge to edge with no margin, darker and
heavier than a plain workshop plaque: black-stained wood with a narrow band of oxidized red
seal-ink running along the top and bottom edges only. A thin bright ink border traced just
inside the edge. One small iron tack at each corner. The centre is bare dark wood, empty.

Keep the red bands and the tacks well inside the outer 20 pixels of each edge, and keep the
middle third of every edge plain so it can be stretched seamlessly. Fully transparent
background outside the plaque. No text, no letters, no numerals, no shadow, no rounded corners.
```

### 12.4 층 고르개 `ui/chip.png` · `ui/chip-on.png`

단추보다 작고 얇다. 다섯 개가 나란히 붙으므로 **테가 굵으면 줄이 새까매진다.**

```
[공통 화풍 블록]

A small thin wooden tally-tag from a carpenters' workshop, drawn head-on, filling the whole
frame edge to edge with no margin. Pale planed wood, one hairline brushed ink border just
inside the edge, a single tiny notch cut into the middle of the top edge. Nothing else — the
centre is bare so a number can be written on it.

Keep the notch and the border well inside the outer 14 pixels of each edge, and keep the
middle third of the left and right edges plain. Fully transparent background outside the tag.
No text, no numerals, no shadow.
```

`chip-on.png` 은 같은 문장 뒤에 붙인다:

```
This time the tag is the one that has been picked: the wood is inked dark oxidized-red brown
all over, the border line and the notch read light against it, and a small ink dot sits at
each of the two lower corners. Same shape, same size, same notch position.
```

### 12.5 창 테두리 `ui/panel.png`

검수 창·규칙·설정·등수가 전부 이걸 쓴다. **가운데가 비어 있어야** 글과 그림이 얹힌다.

```
[공통 화풍 블록]

A sheet of aged mulberry drawing paper seen flat from directly above, filling the whole frame.
The four edges are hand-torn with soft fibrous deckle, slightly uneven, not cut straight. A
single brushed ink rule runs around the sheet a little inside the torn edge, closing at the
corners with a small overlap where the brush crossed itself. In each corner, faint foxing and
one small ink fingerprint smudge. The entire middle of the sheet is empty paper — no drawing,
no writing, no ornament.

All torn edge, ink rule and corner detail must sit within the outer 44 pixels of each edge.
The middle third of every edge must be plain paper so it can be stretched. Fully transparent
outside the sheet. No text, no letters, no numerals, no shadow.
```

### 12.6 제목 띠 `ui/ribbon.png`

창 제목(`문틀 완성`, `끝없이 풀기 등수`) 밑에 깔린다.

```
[공통 화풍 블록]

A narrow horizontal strip of dark hemp cloth stretched flat, filling the whole frame edge to
edge. Coarse woven texture, slightly frayed at the far left and far right ends only. A single
thin bright stitch line runs along the top and bottom of the strip. The centre is plain cloth,
empty, because a title will be written across it.

Keep the frayed ends and any detail within the outer 24 pixels of the left and right edges,
and keep the middle plain so it can be stretched to any width. Fully transparent background
above and below the strip. No text, no letters, no shadow.
```

### 12.7 구분선 `ui/divider.png`

의뢰 이름 밑, 등수표 줄 사이에 쓴다. 지금은 회색 실선 1px 이라 제일 티 난다.

```
[공통 화풍 블록]

A single horizontal ink line brushed across a wide, very short frame, filling it left to right.
The stroke is thickest in the middle and thins to nothing at both ends, with a dry-brush break
or two along the way. Nothing else in the frame.

Fully transparent background. No text, no ornament, no shadow.
```

### 12.8 소리 크기 손잡이 `ui/slider-track.png` · `ui/slider-thumb.png`

두 장을 **같은 프롬프트 안에서 따로** 뽑는다. 홈과 마개가 같은 나무로 보여야 한다.

```
[공통 화풍 블록]

A narrow horizontal groove chiselled into a wooden workbench, seen from directly above,
filling the whole frame edge to edge. The groove is a dark recessed channel with pale planed
wood on both sides and a thin ink line along each lip. The middle of the groove is plain so
it can be stretched to any length.

Keep all detail within the outer 10 pixels of the left and right edges. Fully transparent
background. No text, no shadow.
```

```
[공통 화풍 블록]

A single small wooden peg or wedge seen from directly above, standing upright and centred in
the frame, taller than it is wide. Pale planed wood with a dark ink outline, one horizontal
grain line across its middle and a small iron pin through the centre. Nothing else.

Fully transparent background. No text, no shadow, no groove, no background wood.
```

---

### 12.9 받으면 내가 하는 일

`btn`·`chip`·`panel`·`ribbon`·`slider-track` 은 `border-image` 로 걸고, 자름 값은 위 표대로
넣는다. `slider-thumb` 와 `divider` 는 늘리지 않고 그대로 얹는다. 파일이 없으면 지금의
색 한 겹 + 먹선으로 그냥 물러난다. 그러니 **되는 것부터 하나씩 줘도 된다.**

먼저 주면 좋은 순서: `btn` · `btn-on` → `panel` → `chip` · `chip-on` → 나머지.
이 넷만 들어와도 화면 대부분이 바뀐다.

---

## 13. 상품 그림 — 이미 만들어 두었다

`game/public/art/product-premium.png` — 512×512. VX Shop 콘솔의 상품
`two-sheets-premium` 에 올릴 그림이다.

종이 바탕에 **엽전 세 닢**을 겹쳐 놓고, 뒤에 검수 갑 도장을 옅게 깔고, 아래에
`프리미엄` 한 줄. 먹으로 그은 테를 둘렀다.

사람 그림을 쓰지 않았다. 이 물건이 주는 것은 사람이 아니라 편의다 — 광고를 안 보고,
되돌리기를 아끼지 않고, 엽전을 더 받는 것. 엽전은 그려 넣었다. 둥근 놋쇠에 네모 구멍
하나면 상평통보의 꼴이고, 작은 딱지로 줄여도 무엇인지 바로 읽힌다.

콘솔에 올릴 때 정사각이 아닌 크기를 요구하면 말해 달라. 캔버스로 그린 것이라 크기만
바꿔 다시 뽑으면 된다.
