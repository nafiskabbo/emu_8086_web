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
} as const;

export type SampleKey = keyof typeof SAMPLES;

export const SAMPLE_OPTIONS: { key: SampleKey; label: string }[] = [
  { key: "hello", label: "Hello, world" },
  { key: "sum", label: "Sum an array" },
  { key: "loop", label: "Countdown loop" },
  { key: "swap", label: "Sort two numbers" },
  { key: "string", label: "String copy (REP MOVSB)" },
];

export const DEFAULT_SOURCE = SAMPLES.hello;

export const AUTOSAVE_KEY = "emu8086web:source";
export const THEME_KEY = "emu8086web:theme";
