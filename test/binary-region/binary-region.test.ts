import { TestResults } from "../common";
import { binaryRegionFilenames } from "./filenames";
import { BinaryRegion3, Future } from "../../lib/binary-region-3";
import { htmlTemplate } from "../../lib/general";
import * as formats from '../../lib/snapshot-binary-html-formats';

suite(BinaryRegion3.name, function () {
  test('empty', () => {
    const testResults = new TestResults();
    const region = new BinaryRegion3();

    const outputBinary = region.toBuffer();
    const outputHTML = htmlTemplate(region.toHTML());

    testResults.push(outputBinary, binaryRegionFilenames.empty.binary)
    testResults.push(outputHTML, binaryRegionFilenames.empty.html);

    testResults.checkAll();
  });

  test('basic', () => {
    const testResults = new TestResults();
    const region = new BinaryRegion3();

    region.append(1, undefined, formats.uInt8Row);
    region.append(2, undefined, formats.sInt8Row);
    region.append(-2, undefined, formats.sInt8Row);
    region.append(3, undefined, formats.uInt16LERow);
    region.append(3, undefined, formats.sInt16LERow);
    region.append(-3, undefined, formats.sInt16LERow);
    region.append(4, undefined, formats.uInt32LERow);
    region.append(4, undefined, formats.sInt32LERow);
    region.append(-4, undefined, formats.sInt32LERow);
    region.append(5, undefined, formats.doubleLERow);
    region.append(0.5, undefined, formats.doubleLERow);
    region.append(-0.5, undefined, formats.doubleLERow);
    region.append('Hello, World!', undefined, formats.stringUtf8NTRow);

    const outputBinary = region.toBuffer();
    const outputHTML = htmlTemplate(region.toHTML());

    testResults.push(outputBinary, binaryRegionFilenames.basic.binary);
    testResults.push(outputHTML, binaryRegionFilenames.basic.html);

    testResults.checkAll();
  });

  test('placeholders', () => {
    const testResults = new TestResults();
    const region = new BinaryRegion3();

    const futurePrefilled = new Future();
    const futurePostFilled = new Future();
    const futureUnfilled = new Future();

    futurePrefilled.assign(41);

    region.append(1, undefined, formats.uInt8Row);
    region.append(2, undefined, formats.sInt8Row);
    region.append(-2, undefined, formats.sInt8Row);
    region.append(3, undefined, formats.uInt16LERow);
    region.append(futurePrefilled, undefined, formats.sInt16LERow);
    region.append(futurePostFilled, undefined, formats.sInt16LERow);
    region.append(futureUnfilled, undefined, formats.sInt16LERow);
    region.append(4, undefined, formats.uInt32LERow);
    region.append(4, undefined, formats.sInt32LERow);
    region.append(-4, undefined, formats.sInt32LERow);
    region.append(5, undefined, formats.doubleLERow);
    region.append(0.5, undefined, formats.doubleLERow);
    region.append(-0.5, undefined, formats.doubleLERow);
    region.append('Hello, World!', undefined, formats.stringUtf8NTRow);

    futurePostFilled.assign(42);

    const outputBinary = region.toBuffer(false);
    const outputHTML = htmlTemplate(region.toHTML());

    testResults.push(outputBinary, binaryRegionFilenames.placeholders.binary);
    testResults.push(outputHTML, binaryRegionFilenames.placeholders.html);

    testResults.checkAll();
  });
});