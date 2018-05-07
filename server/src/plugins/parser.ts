export abstract class JsonParser {
  public abstract register(): string;
  public abstract parse(data: any): string;
}

export abstract class FileParser {
  public abstract register(): string;
  public abstract parse(filePath: string): any;
}
