import json, uuid

def main(request, response):
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');

    key = 0;
    if 'endpoint' in request.GET:
        key = uuid.uuid5(uuid.NAMESPACE_OID, request.GET['endpoint']).get_urn()

    if key == 0:
        response.status = 400
        return 'invalid endpoint'

    path = '/'.join(request.url_parts.path.split('/')[:-1]) + '/'
    if request.method == 'POST':
        reports = request.server.stash.take(key, path) or []
        for report in json.loads(request.body):
            reports.append(report)
        request.server.stash.put(key, reports, path)
        return "done"+key+request.body

    if request.method == 'GET':
        response.headers.set('Content-Type', 'application/json')
        return json.dumps(request.server.stash.take(key, path) or [])

    response.status = 400
    return 'invalid method'
