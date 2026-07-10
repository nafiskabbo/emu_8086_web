/** Sample programs for classroom use. */
export const SAMPLES = {
  hello: `.model small
.stack 100h
.data
    msg db 'Hello, world!$'
.code
main proc
    mov ax, @data
    mov ds, ax

    mov ah, 9
    mov dx, offset msg
    int 21h

    mov ah, 4ch
    int 21h
main endp
end main`,

  add2: `.model small
.stack 100h
.data
    num1  dw 25
    num2  dw 17
    msg   db '25 + 17 = $'
.code
main proc
    mov ax, @data
    mov ds, ax

    mov ah, 9
    mov dx, offset msg
    int 21h

    mov ax, num1
    add ax, num2
    call print_ax

    mov ah, 4ch
    int 21h
main endp

print_ax proc
    push ax
    push bx
    push cx
    push dx
    mov cx, 0
    mov bx, 10
divloop:
    mov dx, 0
    div bx
    push dx
    inc cx
    cmp ax, 0
    jne divloop
outloop:
    pop dx
    add dl, '0'
    mov ah, 2
    int 21h
    loop outloop
    pop dx
    pop cx
    pop bx
    pop ax
    ret
print_ax endp
end main`,

  multiply: `.model small
.stack 100h
.data
    num1  dw 12
    num2  dw 7
    msg   db '12 * 7 = $'
.code
main proc
    mov ax, @data
    mov ds, ax

    mov ah, 9
    mov dx, offset msg
    int 21h

    mov ax, num1
    mul num2
    call print_ax

    mov ah, 4ch
    int 21h
main endp

print_ax proc
    push ax
    push bx
    push cx
    push dx
    mov cx, 0
    mov bx, 10
divloop:
    mov dx, 0
    div bx
    push dx
    inc cx
    cmp ax, 0
    jne divloop
outloop:
    pop dx
    add dl, '0'
    mov ah, 2
    int 21h
    loop outloop
    pop dx
    pop cx
    pop bx
    pop ax
    ret
print_ax endp
end main`,

  sum: `.model small
.stack 100h
.data
    arr   dw 4, 8, 15, 16, 23, 42
    count dw 6
    total dw ?
    msg   db 'Sum = $'
.code
main proc
    mov ax, @data
    mov ds, ax

    mov cx, count
    mov si, 0
    mov ax, 0

sumloop:
    add ax, arr[si]
    add si, 2
    loop sumloop

    mov total, ax

    mov ah, 9
    mov dx, offset msg
    int 21h

    call print_ax

    mov ah, 4ch
    int 21h
main endp

print_ax proc
    push ax
    push bx
    push cx
    push dx
    mov cx, 0
    mov bx, 10
divloop:
    mov dx, 0
    div bx
    push dx
    inc cx
    cmp ax, 0
    jne divloop
outloop:
    pop dx
    add dl, '0'
    mov ah, 2
    int 21h
    loop outloop
    pop dx
    pop cx
    pop bx
    pop ax
    ret
print_ax endp
end main`,

  loop: `.model small
.stack 100h
.data
    msg db 'Counting down: $'
    nl  db 13, 10, '$'
.code
main proc
    mov ax, @data
    mov ds, ax

    mov ah, 9
    mov dx, offset msg
    int 21h

    mov cx, 5
count_down:
    mov dl, cl
    add dl, '0'
    mov ah, 2
    int 21h
    mov dl, ' '
    int 21h
    loop count_down

    mov dx, offset nl
    mov ah, 9
    int 21h

    mov ah, 4ch
    int 21h
main endp
end main`,

  swap: `.model small
.stack 100h
.data
    a db 42
    b db 17
    msg1 db 'Before: $'
    msg2 db 'After:  $'
.code
main proc
    mov ax, @data
    mov ds, ax

    mov ah, 9
    mov dx, offset msg1
    int 21h
    call print_a_b

    mov al, a
    mov ah, b
    cmp al, ah
    jle done
    mov a, ah
    mov b, al
done:
    mov dx, offset msg2
    mov ah, 9
    int 21h
    call print_a_b

    mov ah, 4ch
    int 21h
main endp

print_a_b proc
    mov dl, a
    add dl, '0'
    mov ah, 2
    int 21h
    mov dl, ' '
    int 21h
    mov dl, b
    add dl, '0'
    int 21h
    mov dl, 13
    int 21h
    mov dl, 10
    int 21h
    ret
print_a_b endp
end main`,

  largest: `.model small
.stack 100h
.data
    a    dw 34
    b    dw 89
    msg  db 'Larger number = $'
.code
main proc
    mov ax, @data
    mov ds, ax

    mov ah, 9
    mov dx, offset msg
    int 21h

    mov ax, a
    cmp ax, b
    jge print
    mov ax, b
print:
    call print_ax

    mov ah, 4ch
    int 21h
main endp

print_ax proc
    push ax
    push bx
    push cx
    push dx
    mov cx, 0
    mov bx, 10
divloop:
    mov dx, 0
    div bx
    push dx
    inc cx
    cmp ax, 0
    jne divloop
outloop:
    pop dx
    add dl, '0'
    mov ah, 2
    int 21h
    loop outloop
    pop dx
    pop cx
    pop bx
    pop ax
    ret
print_ax endp
end main`,

  echo: `.model small
.stack 100h
.data
    prompt db 'Type a character: $'
    reply  db 13, 10, 'You typed: $'
.code
main proc
    mov ax, @data
    mov ds, ax

    mov ah, 9
    mov dx, offset prompt
    int 21h

    mov ah, 1
    int 21h
    mov bl, al

    mov ah, 9
    mov dx, offset reply
    int 21h

    mov dl, bl
    mov ah, 2
    int 21h

    mov ah, 4ch
    int 21h
main endp
end main`,

  string: `.model small
.stack 100h
.data
    src db '8086','$'
    dst db 6 dup (?)
.code
main proc
    mov ax, @data
    mov ds, ax
    mov es, ax

    mov si, offset src
    mov di, offset dst
    mov cx, 5
    cld
    rep movsb

    mov ah, 9
    mov dx, offset dst
    int 21h

    mov ah, 4ch
    int 21h
main endp
end main`,

  factorial: `.model small
.stack 100h
.data
    n    dw 5
    msg  db '5! = $'
.code
main proc
    mov ax, @data
    mov ds, ax

    mov ah, 9
    mov dx, offset msg
    int 21h

    mov cx, n
    mov ax, 1
fact:
    mul cx
    loop fact

    call print_ax

    mov ah, 4ch
    int 21h
main endp

print_ax proc
    push ax
    push bx
    push cx
    push dx
    mov cx, 0
    mov bx, 10
divloop:
    mov dx, 0
    div bx
    push dx
    inc cx
    cmp ax, 0
    jne divloop
outloop:
    pop dx
    add dl, '0'
    mov ah, 2
    int 21h
    loop outloop
    pop dx
    pop cx
    pop bx
    pop ax
    ret
print_ax endp
end main`,
} as const;

export type SampleKey = keyof typeof SAMPLES;

export const SAMPLE_OPTIONS: { key: SampleKey; label: string }[] = [
  { key: "hello", label: "Hello, world" },
  { key: "add2", label: "Add two numbers" },
  { key: "multiply", label: "Multiply two numbers" },
  { key: "sum", label: "Sum an array" },
  { key: "loop", label: "Countdown loop" },
  { key: "largest", label: "Larger of two numbers" },
  { key: "swap", label: "Sort two numbers" },
  { key: "echo", label: "Read & echo a character" },
  { key: "string", label: "String copy (REP MOVSB)" },
  { key: "factorial", label: "Factorial (5!)" },
];

export const DEFAULT_SOURCE = SAMPLES.hello;

export const AUTOSAVE_KEY = "emu8086web:source";
export const THEME_KEY = "emu8086web:theme";
