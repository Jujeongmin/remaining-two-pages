/*
 * 게임 서버로 가는 문. 인스턴스를 한 군데에만 두고 순위표와 계정 저장이 같이 쓴다.
 *
 * 문서의 예제는 React 훅(useGameServer)뿐이지만, 패키지가 내보내는 GameServer 클래스를
 * 그대로 쓰면 React 없이도 된다. 붙이는 자리에서 이렇게 한 줄이면 끝난다.
 *
 *   import { GameServer } from '@agent8/gameserver';
 *   const server = GameServer.getInstance();   // verse 는 VITE_AGENT8_VERSE 에서 읽는다
 *   await server.connect();
 *   register(server);
 *
 * server.js 를 고치면 npx -y @agent8/deploy 로 다시 올려야 하고, 그때 .env 에
 * VITE_AGENT8_VERSE 가 생긴다. 그 전까지는 available() 이 거짓이라, 순위표는 조용히
 * 빠지고 기록은 브라우저에만 남는다. 서버가 없다고 못 노는 게임이 되면 안 된다.
 */
let server = null;

export function register(instance) { server = instance || null; }

export function available() { return !!server; }

export async function call(fn, args = []) {
  if (!server) return null;
  try {
    return await server.remoteFunction(fn, args);
  } catch (e) {
    return null;   // 끊겼거나 아직 안 올라간 함수. 게임은 그대로 이어진다.
  }
}
