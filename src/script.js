class Todo {
  /* 
    selectors — объект, в котором хранятся CSS-селекторы.
  */
  selectors = {
    root: '[data-js-todo]',
    newTaskForm: '[data-js-todo-new-task-form]',
    newTaskInput: '[data-js-todo-new-task-input]',
    searchTaskForm: '[data-js-todo-search-task-form]',
    searchTaskInput: '[data-js-todo-search-task-input]',
    totalTasks: '[data-js-todo-total-tasks]',
    deleteAllButton: '[data-js-todo-delete-all-button]',
    list: '[data-js-todo-list]',
    item: '[data-js-todo-item]',
    itemCheckbox: '[data-js-todo-item-checkbox]',
    itemLabel: '[data-js-todo-item-label]',
    itemDeleteButton: '[data-js-todo-item-delete-button]',
    emptyMessage: '[data-js-todo-empty-message]',
  }

  /* 
    stateClasses — CSS классы, которые используются
    для анимаций (появление/исчезновение)
  */
  stateClasses = {
    isVisible: 'is-visible',
    isDisappearing: 'is-disappearing',
  }

  /* 
    Ключ, по которому данные сохраняются в localStorage.
  */
  localStorageKey = 'todo-items'

  constructor() {
    /*
      Тут мы находим все элементы на странице.
      this.rootElement — "корневой" элемент, внутри которого всё ищем.
    */
    this.rootElement = document.querySelector(this.selectors.root)
    this.newTaskFormElement = this.rootElement.querySelector(this.selectors.newTaskForm)
    this.newTaskInputElement = this.rootElement.querySelector(this.selectors.newTaskInput)
    this.searchTaskFormElement = this.rootElement.querySelector(this.selectors.searchTaskForm)
    this.searchTaskInputElement = this.rootElement.querySelector(this.selectors.searchTaskInput)
    this.totalTasksElement = this.rootElement.querySelector(this.selectors.totalTasks)
    this.deleteAllButtonElement = this.rootElement.querySelector(this.selectors.deleteAllButton)
    this.listElement = this.rootElement.querySelector(this.selectors.list)
    this.emptyMessageElement = this.rootElement.querySelector(this.selectors.emptyMessage)

    /*
      В state хранятся:
      - items: список задач (из localStorage)
      - filteredItems: задачи после поиска (null — фильтр выключен)
      - searchQuery: текст поиска
    */
    this.state = {
      items: this.getItemsFromLocalStorage(),
      filteredItems: null,
      searchQuery: '',
    }

    // Первый рендер
    this.render()

    // Привязываем обработчики событий
    this.bindEvents()
  }

  /*
    Получение задач из localStorage
  */
  getItemsFromLocalStorage() {
    const rawData = localStorage.getItem(this.localStorageKey)

    if (!rawData) {
      return []
    }

    try {
      const parsedData = JSON.parse(rawData)

      return Array.isArray(parsedData) ? parsedData : []
    } catch  {
      console.error('Todo items parse error')
      return []
    }
  }

  /*
    Сохранение задач в localStorage
  */
  saveItemsToLocalStorage() {
    localStorage.setItem(
      this.localStorageKey,
      JSON.stringify(this.state.items)
    )
  }

  /*
    Перерисовка интерфейса.
    Всегда вызывается после любого изменения списка задач.
  */
  render() {
    // Обновляем счётчик задач
    this.totalTasksElement.textContent = this.state.items.length  

    /*
      Показываем/скрываем кнопку "удалить всё"

      classList.toggle(класс, условие)
      → добавляет класс, если условие true
      → удаляет, если false
    */
    this.deleteAllButtonElement.classList.toggle(
      this.stateClasses.isVisible,
      this.state.items.length > 0
    )

    /*
      Выбор списка задач:
      Если есть filteredItems → используем их
      Иначе используем this.state.items

      Оператор ?? (nullish-coalescing)
      означает:
        если слева стоит null или undefined → взять значение справа

      ТАК ЭТО ВЫГЛЯДЕЛО БЫ ЧЕРЕЗ if:
        let items;
        if (this.state.filteredItems === null || this.state.filteredItems === undefined) {
          items = this.state.items;
        } else {
          items = this.state.filteredItems;
        }
    */
    const items = this.state.filteredItems ?? this.state.items

    /*
      Вставляем задачи в HTML.
      map создаёт массив HTML-строк, join объединяет их в одну строку.
    */
    this.listElement.innerHTML = items.map(({ id, title, isChecked }) => `
        <li class="todo__item todo-item" data-js-todo-item>
          <input
            class="todo-item__checkbox"
            id="${id}"
            type="checkbox"
            ${isChecked ? 'checked' : ''}
            data-js-todo-item-checkbox
          />
          <label
            class="todo-item__label"
            for="${id}"
            data-js-todo-item-label
          >
            ${title}
          </label>
          <button
            class="todo-item__delete-button"
            type="button"
            aria-label="Delete"
            title="Delete"
            data-js-todo-item-delete-button
          >
            <svg ...> ... </svg>
          </button>
        </li>
     `).join('')

    /*
      Текст под списком:
      - если фильтр включён и задач после поиска нет → "Tasks not found"
      - если нет вообще задач → "There are no tasks yet"
      - иначе пустая строка
    */

    const isEmptyFilteredItems = this.state.filteredItems?.length === 0
    const isEmptyItems = this.state.items.length === 0

    this.emptyMessageElement.textContent =
      isEmptyFilteredItems ? 'Tasks not found'
        : isEmptyItems ? 'There are no tasks yet'
          : ''
  }

  /*
    Добавление новой задачи
  */
  addItem(title) {
    /*
      id создаётся так:
      1) crypto.randomUUID() — если доступно
      2) иначе Date.now().toString()

      crypto?.randomUUID(): ?. — опциональная цепочка: 
      если crypto есть → вызвать randomUUID
      если нет → undefined 
      а ?? берёт правую часть, если слева null/undefined
    */
    this.state.items.push({
      id: crypto?.randomUUID() ?? Date.now().toString(),
      title,
      isChecked: false,
    })

    this.saveItemsToLocalStorage()
    this.render()
  }

  /*
    Удаление задачи по id
  */
  deleteItem(id) {
    this.state.items = this.state.items.filter((item) => item.id !== id)
    this.saveItemsToLocalStorage()
    this.render()
  }

  /*
    Переключение состояния чекбокса задачи
  */
  toggleCheckedState(id) {
    this.state.items = this.state.items.map((item) => {
      if (item.id === id) {
        return {
          ...item,
          isChecked: !item.isChecked,
        }
      }
      return item
    })
    this.saveItemsToLocalStorage()
    this.render()
  }

  /*
    Поиск задач
  */
  filter() {
    const queryFormatted = this.state.searchQuery.toLowerCase()
    this.state.filteredItems = this.state.items.filter(({ title }) => {
      const titleFormatted = title.toLowerCase()

      return titleFormatted.includes(queryFormatted)
    })
    this.render()
  }

  /*
    Сброс поиска
  */
  resetFilter() {
    this.state.filteredItems = null
    this.state.searchQuery = ''
    this.render()
  }

  /*
    Обработчики событий
  */

  onNewTaskFormSubmit = (event) => {
    event.preventDefault()

    const newTodoItemTitle = this.newTaskInputElement.value

    if (newTodoItemTitle.trim().length > 0) {
      this.addItem(newTodoItemTitle)
      this.resetFilter()
      this.newTaskInputElement.value = ''
      this.newTaskInputElement.focus()
    }
  }

  onSearchTaskFormSubmit = event => {
    event.preventDefault()
  }

  onSearchTaskInputChange = ({ target }) => {
    const value = target.value.trim()

    if(value.length > 0) {
      this.state.searchQuery = value
      this.filter()
    } else {
      this.resetFilter()
    }
  }

  onDeleteAllButtonClick = () => {
    const isConfirmed = confirm('Are you sure you want to delete all?')

    if (isConfirmed) {
      this.state.items = []
      this.saveItemsToLocalStorage()
      this.render()
    }
  }

  /*
    Обработчик кликов в списке задач
    Определяет, нажали ли по кнопке удаления
  */
  onClick = ({ target }) => {
    if (target.matches(this.selectors.itemDeleteButton)) {
      const itemElement = target.closest(this.selectors.item)
      const itemCheckboxElement = itemElement.querySelector(this.selectors.itemCheckbox)

      itemElement.classList.add(this.stateClasses.isDisappearing)

      /*
        Задержка, чтобы проигралась анимация исчезновения
      */
      setTimeout(() => {
        this.deleteItem(itemCheckboxElement.id)
      }, 400)
    }
  }

  /*
    Обработчик изменения чекбоксов
  */
  onChange = ({ target }) => {
    if (target.matches(this.selectors.itemCheckbox)) {
      this.toggleCheckedState(target.id)
    }
  }

  /*
    Привязка событий ко всем элементам
  */
  bindEvents() {
    this.newTaskFormElement.addEventListener('submit', this.onNewTaskFormSubmit)
    this.searchTaskFormElement.addEventListener('submit', this.onSearchTaskFormSubmit)
    this.searchTaskInputElement.addEventListener('input', this.onSearchTaskInputChange)
    this.deleteAllButtonElement.addEventListener('click', this.onDeleteAllButtonClick)
    this.listElement.addEventListener('click', this.onClick)
    this.listElement.addEventListener('change', this.onChange)
  }
}

new Todo()