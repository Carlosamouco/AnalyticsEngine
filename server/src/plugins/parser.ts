/**
 * Base class for converting a JS Object to a given file format. Plugins installed to parse input JSON data must extend this class.
 */
export abstract class JsonParser {
  /**
   * Register the parser name. The name should be equal to the file extension that the data will be comverted to.
   */
  public abstract register(): string;

  /**
   * Register the parser name. The name should be equal to the file extension that the data will be converted to.
   * @param data Object JSON like to be converted to a file format.
   */
  public abstract parse(data: any): string;
}

/**
 * Base class for converting a file's content to a JSON string. Plugins installed to parse output data must extend this class.
 */
export abstract class FileParser {
  /**
   * Register the parser name. The name should be equal to the file extension to be parsed.
   */
  public abstract register(): string;

  /**
   * Converts a some file's data syncronously to a JSON string.
   * @param data Data of a file to be parsed.
   */
  public abstract parse(data: string): string;
}
