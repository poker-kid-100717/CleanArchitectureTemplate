import { ChangeDetectorRef, Component, Injector, TemplateRef, afterNextRender, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import {
  CreateTodoItemCommand, CreateTodoListCommand, SwaggerException, TodoItemDto, TodoItemsClient,
  TodoListDto, TodoListsClient, TodosVm, UpdateTodoItemCommand, UpdateTodoItemDetailCommand,
  UpdateTodoListCommand
} from '../web-api-client';

interface NewListEditor { title?: string; error?: string; }
interface ListOptionsEditor { id?: number; title?: string; }
interface ItemDetailsEditor { id?: number; listId?: number; priority?: number; note?: string; }

@Component({
  selector: 'app-todo',
  imports: [FormsModule],
  templateUrl: './todo.component.html',
  styleUrl: './todo.component.scss'
})
export class TodoComponent {
  private readonly listsClient = inject(TodoListsClient);
  private readonly itemsClient = inject(TodoItemsClient);
  private readonly modalService = inject(NgbModal);
  // Most state here is a mutable view model updated from HTTP callbacks;
  // mark the view dirty whenever one lands.
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly injector = inject(Injector);

  vm?: TodosVm;
  selectedList?: TodoListDto;
  selectedItem?: TodoItemDto;

  newListEditor: NewListEditor = {};
  listOptionsEditor: ListOptionsEditor = {};
  itemDetailsEditor: ItemDetailsEditor = {};

  private newListModalRef?: NgbModalRef;
  private listOptionsModalRef?: NgbModalRef;
  private deleteListModalRef?: NgbModalRef;
  private itemDetailsModalRef?: NgbModalRef;

  constructor() {
    this.listsClient.get().subscribe({
      next: result => {
        this.vm = result;
        this.selectedList = this.vm.lists?.[0];
        this.cdr.markForCheck();
      },
      error: error => console.error(error)
    });
  }

  // Lists

  remainingItems(list: TodoListDto): number {
    return (list.items ?? []).filter(t => !t.done).length;
  }

  showNewListModal(template: TemplateRef<unknown>): void {
    this.newListModalRef = this.modalService.open(template);
  }

  newListCancelled(): void {
    this.newListModalRef?.close();
    this.newListEditor = {};
  }

  addList(): void {
    const title = this.newListEditor.title ?? '';

    this.listsClient.create(new CreateTodoListCommand({ title })).subscribe({
      next: id => {
        const list = new TodoListDto({ id, title, items: [] });
        this.vm!.lists!.push(list);
        this.selectedList = list;
        this.newListModalRef?.close();
        this.newListEditor = {};
        this.cdr.markForCheck();
      },
      error: error => {
        this.newListEditor.error = this.validationError(error, 'Title');
        this.cdr.markForCheck();
      }
    });
  }

  showListOptionsModal(template: TemplateRef<unknown>): void {
    this.listOptionsEditor = { id: this.selectedList!.id, title: this.selectedList!.title };
    this.listOptionsModalRef = this.modalService.open(template);
  }

  updateListOptions(): void {
    const list = this.selectedList!;

    this.listsClient.update(list.id!, new UpdateTodoListCommand(this.listOptionsEditor)).subscribe({
      next: () => {
        list.title = this.listOptionsEditor.title;
        this.listOptionsModalRef?.close();
        this.listOptionsEditor = {};
        this.cdr.markForCheck();
      },
      error: error => console.error(error)
    });
  }

  confirmDeleteList(template: TemplateRef<unknown>): void {
    this.listOptionsModalRef?.close();
    this.deleteListModalRef = this.modalService.open(template);
  }

  deleteListConfirmed(): void {
    const list = this.selectedList!;

    this.listsClient.delete(list.id!).subscribe({
      next: () => {
        this.deleteListModalRef?.close();
        this.vm!.lists = this.vm!.lists!.filter(t => t.id !== list.id);
        this.selectedList = this.vm!.lists[0];
        this.cdr.markForCheck();
      },
      error: error => console.error(error)
    });
  }

  // Items

  showItemDetailsModal(template: TemplateRef<unknown>, item: TodoItemDto): void {
    this.selectedItem = item;
    this.itemDetailsEditor = { id: item.id, listId: item.listId, priority: item.priority, note: item.note };
    this.itemDetailsModalRef = this.modalService.open(template);
  }

  updateItemDetails(): void {
    const item = this.selectedItem!;
    const editor = this.itemDetailsEditor;

    this.itemsClient.updateItemDetails(item.id, new UpdateTodoItemDetailCommand(editor)).subscribe({
      next: () => {
        if (item.listId !== editor.listId) {
          this.selectedList!.items = this.selectedList!.items!.filter(i => i.id !== item.id);
          item.listId = editor.listId;
          this.vm!.lists!.find(l => l.id === editor.listId)?.items?.push(item);
        }

        item.priority = editor.priority;
        item.note = editor.note;
        this.itemDetailsModalRef?.close();
        this.itemDetailsEditor = {};
        this.cdr.markForCheck();
      },
      error: error => console.error(error)
    });
  }

  addItem(): void {
    const item = new TodoItemDto({
      id: 0,
      listId: this.selectedList!.id,
      priority: this.vm!.priorityLevels![0].value,
      title: '',
      done: false
    });

    this.selectedList!.items!.push(item);
    this.editItem(item, 'itemTitle' + (this.selectedList!.items!.length - 1));
  }

  editItem(item: TodoItemDto, inputId: string): void {
    this.selectedItem = item;
    // The input only exists after the next render.
    afterNextRender(() => document.getElementById(inputId)?.focus(), { injector: this.injector });
  }

  /**
   * Ends editing an item's title (Enter or blur). Enter also triggers a blur
   * when the input is removed, so only the first call for an edit counts.
   */
  commitItemTitle(item: TodoItemDto, pressedEnter = false): void {
    if (this.selectedItem !== item) {
      return;
    }

    this.selectedItem = undefined;

    if (!item.title?.trim()) {
      this.deleteItem(item);
      return;
    }

    const isNewItem = item.id === 0;
    this.saveItem(item);

    if (isNewItem && pressedEnter) {
      this.addItem();
    }
  }

  saveItem(item: TodoItemDto): void {
    if (item.id === 0) {
      this.itemsClient.create(new CreateTodoItemCommand({ listId: this.selectedList!.id, title: item.title })).subscribe({
        next: id => {
          item.id = id;
          this.cdr.markForCheck();
        },
        error: error => console.error(error)
      });
    } else {
      this.itemsClient.update(item.id!, new UpdateTodoItemCommand({ id: item.id, title: item.title, done: item.done })).subscribe({
        error: error => console.error(error)
      });
    }
  }

  deleteItem(item: TodoItemDto): void {
    this.itemDetailsModalRef?.close();

    if (item.id === 0) {
      this.selectedList!.items = this.selectedList!.items!.filter(i => i !== item);
      this.selectedItem = undefined;
      return;
    }

    this.itemsClient.delete(item.id!).subscribe({
      next: () => {
        this.selectedList!.items = this.selectedList!.items!.filter(t => t.id !== item.id);
        this.cdr.markForCheck();
      },
      error: error => console.error(error)
    });
  }

  /** First validation message for a field from the API's problem details. */
  private validationError(error: unknown, field: string): string {
    if (SwaggerException.isSwaggerException(error)) {
      try {
        const problem = JSON.parse(error.response);
        return problem?.errors?.[field]?.[0] ?? problem?.[field]?.[0] ?? 'Unable to save.';
      } catch {
        // fall through
      }
    }
    return 'Unable to save.';
  }
}
