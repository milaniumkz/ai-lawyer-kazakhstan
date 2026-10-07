import 'package:flutter/services.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';

Future<void> exportClaimPdf(String body) async {
  if (body.trim().isEmpty) throw StateError('Сначала сформируйте проект');
  final font = pw.Font.ttf(
      await rootBundle.load('assets/fonts/LiberationSerif-Regular.ttf'));
  final document = pw.Document();
  document.addPage(pw.MultiPage(
    pageFormat: PdfPageFormat.a4,
    margin: const pw.EdgeInsets.all(36),
    theme: pw.ThemeData.withFont(base: font),
    build: (_) => [
      pw.Header(level: 0, child: pw.Text('Досудебная претензия')),
      pw.Text(body, style: const pw.TextStyle(fontSize: 12, lineSpacing: 4))
    ],
  ));
  await Printing.layoutPdf(
      name: 'Претензия.pdf', onLayout: (_) => document.save());
}
