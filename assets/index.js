const submitBtn = document.getElementById('submit');
const apList = document.getElementById('ap-list');
const ssid = document.getElementById('ssid');
const password = document.getElementById('password');
const apSwitch = document.getElementById('ap-switch');
const stationStatus = document.getElementById('station-status');

const message = (() => {
    const container = document.getElementById('message-container');

    function show(type, text, duration = 3000) {
        const div = document.createElement('div');
        div.className = `message-box message-${type}`;
        div.textContent = text;
        container.appendChild(div);

        setTimeout(() => {
            div.style.opacity = '0';
            div.style.transform = 'translateX(-50%) translateY(-10px)';
            setTimeout(() => div.remove(), 300);
        }, duration);
    }

    return {
        success(text, duration) {
            show('success', text, duration);
        },
        error(text, duration) {
            show('error', text, duration);
        },
        info(text, duration) {
            show('info', text, duration);
        },
        warning(text, duration) {
            show('warning', text, duration);
        }
    };
})();

function createAPItemHTML(items) {
    items.forEach(function (item) {
        const fragment = document.createDocumentFragment();
        const container = document.createElement("div");
        const signalHTML = createWifiSignal(item.rssi);
        container.classList.add('ap-list-item');
        container.innerHTML = `<div class="info"><div class="wifi"></div><div>${item.ssid}</div></div>`;
        container.appendChild(signalHTML);
        fragment.appendChild(container);

        container.addEventListener('click', function () {
            ssid.value = item.ssid;
            message.info(`已选择AP [${item.ssid}]`);
        });

        apList.appendChild(fragment);
    });
}

function createWifiSignal(rssi) {
    const wrapper = document.createElement('div');
    wrapper.className = 'wifi-signal';

    // 把 RSSI 转换为等级（0~5）
    let level = 0;
    if (rssi > -30) level = 5;
    else if (rssi > -60) level = 4;
    else if (rssi > -75) level = 3;
    else if (rssi > -90) level = 2;
    else level = 1;

    for (let i = 1; i <= 5; i++) {
        const bar = document.createElement('div');
        bar.className = `wifi-bar level-${i}`;
        if (i <= level) {
            bar.classList.add('active');
        }
        wrapper.appendChild(bar);
    }
    return wrapper;
}

function request(url, options) {
    const defaultHeaders = {
        'Content-Type': 'application/json'
    };

    options = options || {};
    options.method = options.method || 'GET';
    options.headers = Object.assign({}, defaultHeaders, options.headers || {});

    if (options.body && typeof options.body === 'object') {
        options.body = JSON.stringify(options.body);
    }

    return fetch(url, options).then(function (response) {
        const contentType = response.headers.get('content-type') || '';

        const parse = contentType.includes('application/json')
            ? response.json()
            : response.text();

        return parse.then(function (data) {
            if (!response.ok) {
                // 自定义错误结构
                return Promise.reject({
                    status: response.status,
                    message: response.statusText,
                    data: data
                });
            }
            return data;
        });
    }).catch(function (error) {
        console.error('[request error]', error);
        return Promise.reject(error);
    });
}

function initTogglePassword() {
    const toggle = document.getElementById('toggle');
    toggle.addEventListener('click', () => {
        const input = document.getElementById('password');
        input.type = input.type === 'password' ? 'text' : 'password';
    })
}

function initSubmit() {
    submitBtn.addEventListener('click', () => {
        const ssid = document.getElementById('ssid');
        const password = document.getElementById('password');

        console.log("ssid: ", ssid.value);
        console.log("password ", password.value);

        submitBtn.innerText = '正在连接...';

        request('./submit', {
            method: 'POST',
            body: {
                ssid: ssid.value,
                password: password.value,
            }
        })
            .then(function (res) {
                console.log(res);
                if (res.success) {
                    message.success('连接成功，设备将在3S内重启')
                    submitBtn.innerText = '已连接';
                    stationStatus.classList.add('online');
                } else {
                    message.success('连接失败')
                    submitBtn.innerText = '连接网络';
                }
            })
            .catch(function (err) {
                console.error('登录失败:', err);
                message.error('连接失败,请重试');
            });
    });
}

function scanWIFI() {
    let items = [
        {
            ssid: '扫描失败',
            rssi: 0,
            authmode: '',
        }
    ];

    request('./scan').then(response => {
        console.log(response);
        items = response;
        createAPItemHTML(items);
    }).catch(err => {
        createAPItemHTML(items);
    });
}


(function initApp() {
    console.log('Initializing...');
    initTogglePassword();
    initSubmit();
    scanWIFI();
})();