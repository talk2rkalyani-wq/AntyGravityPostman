const fs = require('fs');

const extractRequestsFromPostman = (itemArray, parentPath = '') => {
    if (!Array.isArray(itemArray)) return [];
    let requests = [];
    for (const item of itemArray) {
       if (item.request) {
          let method = typeof item.request === 'string' ? "GET" : (item.request.method || 'GET');
          let urlObj = typeof item.request === 'string' ? item.request : item.request.url;
          let url = typeof urlObj === 'string' ? urlObj : (urlObj?.raw || '');
          let parsedName = parentPath ? `${parentPath} / ${item.name}` : (item.name || url);
          
          let headers = [{ key: '', value: '', description: '', active: true }];
          if (item.request.header && Array.isArray(item.request.header)) {
             headers = item.request.header.map(h => ({
                key: h.key || '', value: h.value || '', description: h.description || '', active: true
             }));
          } else if (typeof item.request.header === 'string') {
             const parts = item.request.header.split(':');
             if (parts.length >= 2) headers = [{ key: parts[0].trim(), value: parts.slice(1).join(':').trim(), description: '', active: true }];
          }
          if (headers.length === 0) headers.push({ key: '', value: '', description: '', active: true });

          let bodyType = 'none';
          let bodyRaw = '';
          let bodyFormData = [{ key: '', value: '', description: '', active: true }];
          let bodyUrlEncoded = [{ key: '', value: '', description: '', active: true }];
          
          if (item.request.body) {
             if (item.request.body.mode === 'raw') {
                bodyType = 'raw';
                bodyRaw = item.request.body.raw || '';
             } else if (item.request.body.mode === 'formdata' && Array.isArray(item.request.body.formdata)) {
                bodyType = 'form-data';
                bodyFormData = item.request.body.formdata.map(f => ({
                   key: f.key || '', value: f.value || '', description: f.description || '', active: true
                }));
             } else if (item.request.body.mode === 'urlencoded' && Array.isArray(item.request.body.urlencoded)) {
                bodyType = 'x-www-form-urlencoded';
                bodyUrlEncoded = item.request.body.urlencoded.map(f => ({
                   key: f.key || '', value: f.value || '', description: f.description || '', active: true
                }));
             }
          }
          if (bodyFormData.length === 0) bodyFormData.push({ key: '', value: '', description: '', active: true });
          if (bodyUrlEncoded.length === 0) bodyUrlEncoded.push({ key: '', value: '', description: '', active: true });

          let params = [{ key: '', value: '', description: '', active: true }];
          let urlQuery = typeof urlObj === 'string' ? null : urlObj?.query;
          if (urlQuery && Array.isArray(urlQuery)) {
             params = urlQuery.map(q => ({
                key: q.key || '', value: q.value || '', description: q.description || '', active: true
             }));
          }
          if (params.length === 0) params.push({ key: '', value: '', description: '', active: true });

          let preRequestScript = '';
          let postResponseScript = '';
          if (item.event && Array.isArray(item.event)) {
             item.event.forEach(ev => {
                if (ev.listen === 'prerequest' && ev.script && Array.isArray(ev.script.exec)) {
                   preRequestScript = ev.script.exec.join('\n');
                } else if (ev.listen === 'test' && ev.script && Array.isArray(ev.script.exec)) {
                   postResponseScript = ev.script.exec.join('\n');
                }
             });
          }

          requests.push({
             name: parsedName,
             method, url, headers, bodyType, bodyRaw, bodyFormData, bodyUrlEncoded, params,
             bodyGraphQLQuery: '', bodyGraphQLVariables: '', preRequestScript, postResponseScript, authType: 'No Auth', authData: {}, activeTab: 'Params'
          });
       } else if (item.item) {
          const newPath = parentPath ? `${parentPath} / ${item.name}` : item.name;
          requests = requests.concat(extractRequestsFromPostman(item.item, newPath));
       }
    }
    return requests;
 };

try {
    const data = JSON.parse(fs.readFileSync('/Users/raghavkalyani/Downloads/NewUNMS Vendor.postman_collection.json', 'utf8'));
    const requests = extractRequestsFromPostman(data.item);
    console.log(`Success, extracted ${requests.length} requests`);
} catch (e) {
    console.error("Error!!!", e);
}
