export class BookCreatedEevent {
  constructor(
    public readonly id: number,
    public readonly title: string,
    public readonly isbn: string,
    public readonly publishDate: string,
    public readonly price: number,
  ) {}
}
