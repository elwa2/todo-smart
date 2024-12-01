document.addEventListener('DOMContentLoaded', () => {
    const taskInput = document.getElementById('task-input');
    const addTaskBtn = document.getElementById('add-task');
    const taskGroups = document.getElementById('task-groups');
    const tasksCount = document.getElementById('tasks-count');
    const clearCompletedBtn = document.getElementById('clear-completed');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const loadingOverlay = document.getElementById('loading');
    const toggleAiBtn = document.getElementById('toggle-ai');
    const toggleManualBtn = document.getElementById('toggle-manual');

    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    let currentFilter = 'all';
    let isAiMode = true;

    function showLoading() {
        loadingOverlay.classList.add('active');
    }

    function hideLoading() {
        loadingOverlay.classList.remove('active');
    }

    function saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(tasks));
        updateTasksCount();
    }

    function toggleMode(useAi) {
        isAiMode = useAi;
        document.body.classList.toggle('manual-mode', !useAi);
        toggleAiBtn.classList.toggle('active', useAi);
        toggleManualBtn.classList.toggle('active', !useAi);
        
        // تحديث النص التوضيحي والأيقونة
        addTaskBtn.innerHTML = useAi ? '<i class="fas fa-magic"></i>' : '<i class="fas fa-plus"></i>';
        taskInput.placeholder = useAi 
            ? 'اكتب ما تريد تحويله إلى مهام...\nمثال: أريد تنظيم حفلة عيد ميلاد لابني'
            : 'اكتب المهمة مباشرة...';
    }

    toggleAiBtn.addEventListener('click', () => toggleMode(true));
    toggleManualBtn.addEventListener('click', () => toggleMode(false));

    async function addTasks(text) {
        if (isAiMode) {
            showLoading();
            try {
                const taskGroups = await convertToTasks(text);
                const timestamp = Date.now();
                
                taskGroups.forEach((group, groupIndex) => {
                    group.tasks.forEach((taskText, index) => {
                        tasks.unshift({
                            id: `${timestamp}-${groupIndex}-${index}`,
                            text: taskText,
                            group: group.group,
                            completed: false,
                            createdAt: new Date().toISOString()
                        });
                    });
                });
            } catch (error) {
                console.error('خطأ في إضافة المهام:', error);
                // إضافة النص كمهمة واحدة في حالة الخطأ
                tasks.unshift({
                    id: Date.now().toString(),
                    text,
                    group: 'مهام عامة',
                    completed: false,
                    createdAt: new Date().toISOString()
                });
            } finally {
                hideLoading();
            }
        } else {
            // الوضع اليدوي: إضافة مهمة واحدة مباشرة
            tasks.unshift({
                id: Date.now().toString(),
                text,
                group: 'مهام عامة',
                completed: false,
                createdAt: new Date().toISOString()
            });
        }
        
        saveTasks();
        renderTasks();
    }

    function deleteTask(taskId) {
        tasks = tasks.filter(task => task.id !== taskId);
        saveTasks();
        renderTasks();
    }

    function toggleTask(taskId) {
        tasks = tasks.map(task => 
            task.id === taskId 
                ? { ...task, completed: !task.completed }
                : task
        );
        saveTasks();
        renderTasks();
    }

    function updateTasksCount() {
        const activeTasks = tasks.filter(task => !task.completed).length;
        tasksCount.textContent = `${activeTasks} مهام متبقية`;
    }

    function createTaskElement(task) {
        const li = document.createElement('li');
        li.className = `task-item ${task.completed ? 'completed' : ''}`;
        li.innerHTML = `
            <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
            <span class="task-text">${task.text}</span>
            <button class="delete-btn"><i class="fas fa-trash"></i></button>
        `;

        const checkbox = li.querySelector('.task-checkbox');
        checkbox.addEventListener('change', () => toggleTask(task.id));

        const deleteBtn = li.querySelector('.delete-btn');
        deleteBtn.addEventListener('click', () => deleteTask(task.id));

        return li;
    }

    function renderTasks() {
        taskGroups.innerHTML = '';
        let filteredTasks = tasks;

        if (currentFilter === 'active') {
            filteredTasks = tasks.filter(task => !task.completed);
        } else if (currentFilter === 'completed') {
            filteredTasks = tasks.filter(task => task.completed);
        }

        // تجميع المهام حسب المجموعات
        const groupedTasks = filteredTasks.reduce((groups, task) => {
            if (!groups[task.group]) {
                groups[task.group] = [];
            }
            groups[task.group].push(task);
            return groups;
        }, {});

        // إنشاء عناصر المجموعات
        Object.entries(groupedTasks).forEach(([groupName, groupTasks]) => {
            const groupDiv = document.createElement('div');
            groupDiv.className = 'task-group';
            
            const groupHeader = document.createElement('div');
            groupHeader.className = 'group-header';
            groupHeader.innerHTML = `
                <h3 class="group-title">${groupName}</h3>
                <span class="group-count">${groupTasks.length} مهام</span>
            `;
            
            const taskList = document.createElement('ul');
            taskList.className = 'task-list';
            
            groupTasks.forEach(task => {
                taskList.appendChild(createTaskElement(task));
            });
            
            groupDiv.appendChild(groupHeader);
            groupDiv.appendChild(taskList);
            taskGroups.appendChild(groupDiv);
        });
    }

    addTaskBtn.addEventListener('click', () => {
        const text = taskInput.value.trim();
        if (text) {
            addTasks(text);
            taskInput.value = '';
        }
    });

    taskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            addTaskBtn.click();
        }
    });

    clearCompletedBtn.addEventListener('click', () => {
        tasks = tasks.filter(task => !task.completed);
        saveTasks();
        renderTasks();
    });

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            renderTasks();
        });
    });

    // تحميل المهام عند بدء التطبيق
    renderTasks();
});
