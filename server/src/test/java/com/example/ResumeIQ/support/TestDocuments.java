package com.example.ResumeIQ.support;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.apache.poi.xwpf.usermodel.XWPFDocument;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

/**
 * Builds in-memory fixtures. Tests never read or write documents on disk.
 */
public final class TestDocuments {

    private TestDocuments() {
    }

    public static byte[] pdfPages(String... pageTexts) {
        try (PDDocument document = new PDDocument();
             ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            PDType1Font font = new PDType1Font(Standard14Fonts.FontName.HELVETICA);
            for (String pageText : pageTexts) {
                PDPage page = new PDPage();
                document.addPage(page);
                try (PDPageContentStream content = new PDPageContentStream(document, page)) {
                    content.beginText();
                    content.setFont(font, 12);
                    content.newLineAtOffset(72, 720);
                    for (String line : pageText.split("\n", -1)) {
                        content.showText(line);
                        content.newLineAtOffset(0, -18);
                    }
                    content.endText();
                }
            }
            document.save(output);
            return output.toByteArray();
        } catch (IOException ex) {
            throw new UncheckedIOException(ex);
        }
    }

    public static byte[] pdf(String text) {
        return pdfPages(text);
    }

    public static byte[] blankPdf() {
        try (PDDocument document = new PDDocument();
             ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            document.addPage(new PDPage());
            document.save(output);
            return output.toByteArray();
        } catch (IOException ex) {
            throw new UncheckedIOException(ex);
        }
    }

    /**
     * Starts with a valid PDF signature but contains no parseable PDF body.
     */
    public static byte[] corruptPdf() {
        return "%PDF-1.7\nthis is not a real PDF body\n".getBytes(StandardCharsets.US_ASCII);
    }

    public static byte[] docx(String... paragraphs) {
        return docxWithStyles(null, paragraphs);
    }

    public static byte[] docxWithHeading(String heading, String... paragraphs) {
        return docxWithStyles(heading, paragraphs);
    }

    private static byte[] docxWithStyles(String heading, String... paragraphs) {
        try (XWPFDocument document = new XWPFDocument();
             ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            if (heading != null) {
                var headingParagraph = document.createParagraph();
                headingParagraph.setStyle("Heading1");
                headingParagraph.createRun().setText(heading);
            }
            for (String text : paragraphs) {
                document.createParagraph().createRun().setText(text);
            }
            document.write(output);
            return output.toByteArray();
        } catch (IOException ex) {
            throw new UncheckedIOException(ex);
        }
    }

    public static byte[] blankDocx() {
        return docx("");
    }

    /**
     * A ZIP containing the DOCX entry names required by validation, but with
     * malformed XML so that Apache POI fails while reading it.
     */
    public static byte[] corruptDocx() {
        try (ByteArrayOutputStream output = new ByteArrayOutputStream();
             ZipOutputStream zip = new ZipOutputStream(output)) {
            zip.putNextEntry(new ZipEntry("[Content_Types].xml"));
            zip.write("<?xml version=\"1.0\"?><Types/>".getBytes(StandardCharsets.UTF_8));
            zip.closeEntry();

            zip.putNextEntry(new ZipEntry("word/document.xml"));
            zip.write("<w:document".getBytes(StandardCharsets.UTF_8));
            zip.closeEntry();

            zip.finish();
            return output.toByteArray();
        } catch (IOException ex) {
            throw new UncheckedIOException(ex);
        }
    }

    /**
     * A ZIP that is not a DOCX package.
     */
    public static byte[] zipWithoutDocxEntries() {
        try (ByteArrayOutputStream output = new ByteArrayOutputStream();
             ZipOutputStream zip = new ZipOutputStream(output)) {
            zip.putNextEntry(new ZipEntry("readme.txt"));
            zip.write("not a document".getBytes(StandardCharsets.UTF_8));
            zip.closeEntry();
            zip.finish();
            return output.toByteArray();
        } catch (IOException ex) {
            throw new UncheckedIOException(ex);
        }
    }

    public static byte[] text(String content) {
        return content.getBytes(StandardCharsets.UTF_8);
    }
}
