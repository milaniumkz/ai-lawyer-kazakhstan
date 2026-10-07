import 'dart:convert';
import 'package:http/http.dart' as transport;
import 'session_credentials.dart';
export 'package:http/http.dart'
    hide get, post, put, patch, delete, MultipartRequest;

Map<String, String> _headers(Map<String, String>? values) => {
      ...?values,
      if (SessionCredentials.token.isNotEmpty)
        'authorization': 'Bearer ${SessionCredentials.token}',
    };
const _timeout = Duration(seconds: 30);
Future<transport.Response> get(Uri url, {Map<String, String>? headers}) =>
    transport.get(url, headers: _headers(headers)).timeout(_timeout);
Future<transport.Response> post(Uri url,
        {Map<String, String>? headers, Object? body, Encoding? encoding}) =>
    transport
        .post(url, headers: _headers(headers), body: body, encoding: encoding)
        .timeout(_timeout);
Future<transport.Response> put(Uri url,
        {Map<String, String>? headers, Object? body, Encoding? encoding}) =>
    transport
        .put(url, headers: _headers(headers), body: body, encoding: encoding)
        .timeout(_timeout);
Future<transport.Response> patch(Uri url,
        {Map<String, String>? headers, Object? body, Encoding? encoding}) =>
    transport
        .patch(url, headers: _headers(headers), body: body, encoding: encoding)
        .timeout(_timeout);
Future<transport.Response> delete(Uri url,
        {Map<String, String>? headers, Object? body, Encoding? encoding}) =>
    transport
        .delete(url, headers: _headers(headers), body: body, encoding: encoding)
        .timeout(_timeout);

class MultipartRequest extends transport.MultipartRequest {
  MultipartRequest(super.method, super.url) {
    headers.addAll(_headers(null));
  }
}
