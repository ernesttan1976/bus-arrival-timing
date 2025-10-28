declare module '@openreplay/tracker' {
  export default class Tracker {
    constructor(config: { projectKey: string; ingestPoint: string });
    start(): void;
  }
}