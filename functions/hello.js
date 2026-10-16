export const onRequest = () => {
  return new Response("Привет! Это ответ с сервера.", {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
