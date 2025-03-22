declare module 'parse-multipart-data' {
  interface Part {
    name?: string;
    filename?: string;
    type?: string;
    data: Buffer;
  }

  function parseMultipart(body: Buffer, boundary: string): Part[];

  export default parseMultipart;
}
