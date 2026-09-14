// Developer category implementation pack — all 59 tools.
import type { ComponentType } from "react";
import {
  Base64EncodeTool, Base64DecodeTool, Base64AdvancedTool, Base32Tool,
  UrlEncodeTool, UrlDecodeTool, HtmlEncodeTool, HtmlDecodeTool,
  HtmlEntitiesTool, JwtDecoderTool,
} from "./codecs";
import {
  JsonFormatterTool, JsonMinifyTool, JsonBeautifierTool, JsonToCsvTool,
  CsvToJsonTool, XmlToJsonTool, JsonToXmlTool, YamlToJsonTool, JsonToYamlTool,
  TomlToJsonTool, JsonDiffTool, JsonToCodeTool, JsonSchemaValidatorTool,
  JsonPathTool, MarkdownTableTool, MarkdownTableBuilderTool,
} from "./json";
import {
  XmlFormatterTool, HtmlFormatterTool, CssFormatterTool, MinifyCssTool,
  JsFormatterTool, MinifyJsTool, MinifyHtmlTool, SqlFormatterTool,
  GraphqlFormatterTool, MarkdownToHtmlTool, HtmlToMarkdownTool,
  DiffCheckerTool, SvgOptimizerTool,
} from "./formatters";
import {
  BoxShadowTool, TextShadowTool, BorderRadiusTool, TriangleTool,
  CssAnimationTool, FlexboxTool, GridTool, GradientTool, ClipPathTool,
  CssVariablesTool, SpecificityTool, CssUnitTool, FlexboxCheatsheetTool,
} from "./css";
import {
  HtmlViewerTool, HttpStatusTool, GitignoreTool, GitCommitTool,
  CronTool, RegexTesterTool, RegexLibraryTool,
} from "./misc";

export const tools: Record<string, ComponentType> = {
  // codecs
  "base64-encode": Base64EncodeTool,
  "base64-decode": Base64DecodeTool,
  "base64-advanced": Base64AdvancedTool,
  "base32": Base32Tool,
  "url-encode": UrlEncodeTool,
  "url-decode": UrlDecodeTool,
  "html-encode": HtmlEncodeTool,
  "html-decode": HtmlDecodeTool,
  "html-entities": HtmlEntitiesTool,
  "jwt-decoder": JwtDecoderTool,
  // json & data
  "json-formatter": JsonFormatterTool,
  "json-beautifier": JsonBeautifierTool,
  "json-minify": JsonMinifyTool,
  "json-to-csv": JsonToCsvTool,
  "csv-to-json": CsvToJsonTool,
  "xml-to-json": XmlToJsonTool,
  "json-to-xml": JsonToXmlTool,
  "yaml-to-json": YamlToJsonTool,
  "json-to-yaml": JsonToYamlTool,
  "toml-to-json": TomlToJsonTool,
  "json-diff": JsonDiffTool,
  "json-to-code": JsonToCodeTool,
  "json-schema-validator": JsonSchemaValidatorTool,
  "json-path-tester": JsonPathTool,
  "markdown-table-gen": MarkdownTableTool,
  "markdown-table-gen2": MarkdownTableBuilderTool,
  // formatters & minifiers
  "xml-formatter": XmlFormatterTool,
  "html-formatter": HtmlFormatterTool,
  "css-formatter": CssFormatterTool,
  "minify-css": MinifyCssTool,
  "js-formatter": JsFormatterTool,
  "minify-js": MinifyJsTool,
  "minify-html": MinifyHtmlTool,
  "sql-formatter": SqlFormatterTool,
  "graphql-formatter": GraphqlFormatterTool,
  "markdown-to-html": MarkdownToHtmlTool,
  "html-to-markdown": HtmlToMarkdownTool,
  "diff-checker": DiffCheckerTool,
  "svg-optimizer": SvgOptimizerTool,
  // css playgrounds
  "css-box-shadow": BoxShadowTool,
  "css-text-shadow": TextShadowTool,
  "css-border-radius": BorderRadiusTool,
  "css-triangle": TriangleTool,
  "css-animation": CssAnimationTool,
  "css-flexbox": FlexboxTool,
  "css-grid": GridTool,
  "css-gradient-gen": GradientTool,
  "css-clip-path": ClipPathTool,
  "css-variables": CssVariablesTool,
  "css-specificity": SpecificityTool,
  "css-unit-converter": CssUnitTool,
  "flexbox-cheatsheet": FlexboxCheatsheetTool,
  // misc
  "html-viewer": HtmlViewerTool,
  "http-status-codes": HttpStatusTool,
  "gitignore-generator": GitignoreTool,
  "git-commit": GitCommitTool,
  "cron-parser": CronTool,
  "regex-tester": RegexTesterTool,
  "regex-library": RegexLibraryTool,
};
