document.addEventListener('DOMContentLoaded', () => {
    const functionInput = document.getElementById('functionInput');
    const xRangeMinInput = document.getElementById('xRangeMin');
    const xRangeMaxInput = document.getElementById('xRangeMax');
    const drawButton = document.getElementById('drawButton');
    const graphCanvas = document.getElementById('graphCanvas');
    const ctx = graphCanvas.getContext('2d');
    const coordinatesDisplay = document.querySelector('.coordinates-display');
    const keyboardDiv = document.querySelector('.keyboard-container');

    // 设置画布尺寸
    graphCanvas.width = 600;
    graphCanvas.height = 600;

    let scaleX = 50; // 1单位 = 50像素
    let scaleY = 50;
    let originX = graphCanvas.width / 2;
    let originY = graphCanvas.height / 2;

    let isDragging = false;
    let lastMouseX = 0;
    let lastMouseY = 0;

    // 键盘布局
    const keyboardLayout = {
        '数字': ['7', '8', '9', '4', '5', '6', '1', '2', '3', '0', '.', 'π'],
        '运算符': ['+', '-', '*', '/', '^', '(', ')'],
        '函数': ['sin', 'cos', 'tan', 'log', 'exp', 'sqrt', 'abs'],
        '其他': ['x', 'Clear', 'Del']
    };

    function createKeyboard() {
        for (const category in keyboardLayout) {
            const categoryDiv = document.createElement('div');
            categoryDiv.classList.add('keyboard-category');
            const categoryTitle = document.createElement('h3');
            categoryTitle.textContent = category;
            categoryDiv.appendChild(categoryTitle);

            const buttonsContainer = document.createElement('div');
            buttonsContainer.classList.add('keyboard-buttons');

            keyboardLayout[category].forEach(key => {
                const button = document.createElement('button');
                button.textContent = key;
                button.addEventListener('click', () => handleKeyPress(key));
                buttonsContainer.appendChild(button);
            });
            categoryDiv.appendChild(buttonsContainer);
            keyboardDiv.appendChild(categoryDiv);
        }
    }

    function handleKeyPress(key) {
        if (key === 'Clear') {
            functionInput.value = '';
        } else if (key === 'Del') {
            functionInput.value = functionInput.value.slice(0, -1);
        } else if (key === 'π') {
            functionInput.value += 'Math.PI';
        } else if (['sin', 'cos', 'tan', 'log', 'exp', 'sqrt', 'abs'].includes(key)) {
            functionInput.value += `Math.${key}(`;
        } else if (key === '^') {
            functionInput.value += '**';
        } else {
            functionInput.value += key;
        }
    }

    function drawGraph() {
        ctx.clearRect(0, 0, graphCanvas.width, graphCanvas.height);

        // 绘制坐标轴
        ctx.beginPath();
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        // X轴
        ctx.moveTo(0, originY);
        ctx.lineTo(graphCanvas.width, originY);
        // Y轴
        ctx.moveTo(originX, 0);
        ctx.lineTo(originX, graphCanvas.height);
        ctx.stroke();

        // 绘制刻度
        ctx.strokeStyle = '#999';
        ctx.lineWidth = 1;
        ctx.font = '10px Arial';
        ctx.fillStyle = '#333';

        // X-axis ticks (X軸刻度)
        for (let i = -originX; i < graphCanvas.width - originX; i += scaleX) {
            if (i !== 0) {
                ctx.beginPath();
                ctx.moveTo(originX + i, originY - 5);
                ctx.lineTo(originX + i, originY + 5);
                ctx.stroke();
                ctx.fillText((i / scaleX).toFixed(0), originX + i - 5, originY + 15);
            }
        }
        // Y-axis ticks (Y軸刻度)
        for (let i = -originY; i < graphCanvas.height - originY; i += scaleY) {
            if (i !== 0) {
                ctx.beginPath();
                ctx.moveTo(originX - 5, originY + i);
                ctx.lineTo(originX + 5, originY + i);
                ctx.stroke();
                ctx.fillText((-i / scaleY).toFixed(0), originX - 20, originY + i + 3);
            }
        }

        // 标注X, Y轴
        ctx.fillText('X', graphCanvas.width - 15, originY - 10);
        ctx.fillText('Y', originX + 10, 15);
        ctx.fillText('0', originX - 15, originY + 15);

        const funcStr = functionInput.value;
        const xMin = parseFloat(xRangeMinInput.value);
        const xMax = parseFloat(xRangeMaxInput.value);

        if (!funcStr || isNaN(xMin) || isNaN(xMax) || xMin >= xMax) {
            return;
        }

        let func;
        try {
            // 替换用户输入中的 'x^n' 为 'Math.pow(x, n)'，'log' 为 'Math.log' 等
            const parsedFuncStr = funcStr
                .replace(/(\w+)\^(\d+)/g, 'Math.pow($1, $2)')
                .replace(/log\((.*?)\)/g, 'Math.log($1)')
                .replace(/sin\((.*?)\)/g, 'Math.sin($1)')
                .replace(/cos\((.*?)\)/g, 'Math.cos($1)')
                .replace(/tan\((.*?)\)/g, 'Math.tan($1)')
                .replace(/exp\((.*?)\)/g, 'Math.exp($1)')
                .replace(/sqrt\((.*?)\)/g, 'Math.sqrt($1)')
                .replace(/abs\((.*?)\)/g, 'Math.abs($1)');

            func = new Function('x', `return ${parsedFuncStr};`);
        } catch (e) {
            alert('无效的函数表达式或x范围。请检查输入。');
            return;
        }

        ctx.beginPath();
        ctx.strokeStyle = 'blue';
        ctx.lineWidth = 2;

        let firstPoint = true;
        const step = (xMax - xMin) / graphCanvas.width; // 根据画布宽度确定步长

        const intersections = [];

        for (let i = 0; i < graphCanvas.width; i++) {
            const x = xMin + (i * step);
            let y;
            try {
                y = func(x);
            } catch (e) {
                // Ignore calculation errors, e.g., division by zero or invalid math operations (忽略計算錯誤，例如除以零或無效的數學操作)
                continue;
            }

            // 检查是否与X轴相交
            if (y * func(x - step) < 0) { // Simple check if crossing X-axis (簡單判斷是否穿過X軸)
                intersections.push({ x: x, y: 0 });
            }
            // Check for intersection with Y-axis (when x is close to 0) (檢查是否與Y軸相交 (當x接近0時))
            if (Math.abs(x) < step && !isNaN(y)) {
                intersections.push({ x: 0, y: y });
            }

            const plotX = originX + x * scaleX;
            const plotY = originY - y * scaleY;

            if (firstPoint) {
                ctx.moveTo(plotX, plotY);
                firstPoint = false;
            } else {
                ctx.lineTo(plotX, plotY);
            }
        }
        ctx.stroke();

        // 标记交点
        ctx.fillStyle = 'red';
        intersections.forEach(point => {
            const plotX = originX + point.x * scaleX;
            const plotY = originY - point.y * scaleY;
            ctx.beginPath();
            ctx.arc(plotX, plotY, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillText(`(${point.x.toFixed(2)}, ${point.y.toFixed(2)})`, plotX + 5, plotY - 5);
        });
    }

    drawButton.addEventListener('click', drawGraph);

    const zoomInButton = document.getElementById('zoomInButton');
    const zoomOutButton = document.getElementById('zoomOutButton');

    zoomInButton.addEventListener('click', () => {
        const zoomFactor = 1.2;
        scaleX *= zoomFactor;
        scaleY *= zoomFactor;
        drawGraph();
    });

    zoomOutButton.addEventListener('click', () => {
        const zoomFactor = 1.2;
        scaleX /= zoomFactor;
        scaleY /= zoomFactor;
        drawGraph();
    });

    graphCanvas.addEventListener('mousedown', (event) => {
        isDragging = true;
        lastMouseX = event.clientX;
        lastMouseY = event.clientY;
        graphCanvas.style.cursor = 'grabbing';
    });

    graphCanvas.addEventListener('mousemove', (event) => {
        const rect = graphCanvas.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;

        const graphX = (mouseX - originX) / scaleX;
        const graphY = (originY - mouseY) / scaleY;

        coordinatesDisplay.textContent = `X: ${graphX.toFixed(2)}, Y: ${graphY.toFixed(2)}`;

        if (isDragging) {
            const deltaX = event.clientX - lastMouseX;
            const deltaY = event.clientY - lastMouseY;
            originX += deltaX;
            originY += deltaY;
            lastMouseX = event.clientX;
            lastMouseY = event.clientY;
            drawGraph();
        }
    });

    graphCanvas.addEventListener('mouseup', () => {
        isDragging = false;
        graphCanvas.style.cursor = 'grab';
    });

    graphCanvas.addEventListener('mouseleave', () => {
        isDragging = false;
        graphCanvas.style.cursor = 'default';
    });

    graphCanvas.addEventListener('wheel', (event) => {
        event.preventDefault();
        const zoomFactor = 1.1;
        const mouseX = event.clientX - graphCanvas.getBoundingClientRect().left;
        const mouseY = event.clientY - graphCanvas.getBoundingClientRect().top;

        // Calculate the graph coordinates before zooming
        const graphXBeforeZoom = (mouseX - originX) / scaleX;
        const graphYBeforeZoom = (originY - mouseY) / scaleY;

        if (event.deltaY < 0) {
            // Zoom in
            scaleX *= zoomFactor;
            scaleY *= zoomFactor;
        } else {
            // Zoom out
            scaleX /= zoomFactor;
            scaleY /= zoomFactor;
        }

        // Calculate new origin to keep the mouse position fixed on the graph
        originX = mouseX - graphXBeforeZoom * scaleX;
        originY = mouseY + graphYBeforeZoom * scaleY;

        drawGraph();
    });

    createKeyboard();
    drawGraph();
});