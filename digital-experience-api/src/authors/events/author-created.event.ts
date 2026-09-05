export class AuthorCreatedEevent {
  constructor(
    public readonly id: number,
    public readonly firstName: string,
    public readonly lastName: string,
  ) {}
}
