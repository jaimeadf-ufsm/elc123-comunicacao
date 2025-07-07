#!/bin/bash
set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' 

SOCKET_PATH="/tmp/hub_socket"
CLIENT1_PIPE="/tmp/client1_pipe"
CLIENT2_PIPE="/tmp/client2_pipe"
CLIENT3_PIPE="/tmp/client3_pipe"
DEMO_TITLE="DEMONSTRAÇÃO - PROTOCOLO COM JANELA DESLIZANTE"

HUB_PID=""
CLIENT1_PID=""
CLIENT2_PID=""
CLIENT3_PID=""

print_header() {
    echo -e "${PURPLE}============================================================================${NC}"
    echo -e "${PURPLE}${DEMO_TITLE}${NC}"
    echo -e "${PURPLE}============================================================================${NC}"
    echo
}

print_step() {
    echo -e "${BLUE}[PASSO $1]${NC} $2"
    echo -e "${YELLOW}Pressione ENTER para continuar...${NC}"
    read
}

print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[AVISO]${NC} $1"
}

cleanup() {
    print_info "Limpando recursos..."
    
    rm -f "$CLIENT1_PIPE" "$CLIENT2_PIPE" "$CLIENT3_PIPE" 2>/dev/null || true
    
    if [ ! -z "$CLIENT1_PID" ]; then
        kill $CLIENT1_PID 2>/dev/null || true
    fi
    if [ ! -z "$CLIENT2_PID" ]; then
        kill $CLIENT2_PID 2>/dev/null || true
    fi
    if [ ! -z "$CLIENT3_PID" ]; then
        kill $CLIENT3_PID 2>/dev/null || true
    fi
    if [ ! -z "$HUB_PID" ]; then
        kill $HUB_PID 2>/dev/null || true
    fi
    
    pkill -f "./comunicacao" 2>/dev/null || true
    
    rm -f "$SOCKET_PATH" 2>/dev/null || true
    
    pkill -f "xterm.*-title.*Hub" 2>/dev/null || true
    pkill -f "xterm.*-title.*Cliente" 2>/dev/null || true
    pkill -f "konsole.*--title.*Hub" 2>/dev/null || true
    pkill -f "konsole.*--title.*Cliente" 2>/dev/null || true
    pkill -f "gnome-terminal.*--title.*Hub" 2>/dev/null || true
    pkill -f "gnome-terminal.*--title.*Cliente" 2>/dev/null || true
    
    print_info "Limpeza concluída."
}

trap cleanup EXIT INT TERM

compile_project() {
    print_info "Compilando o projeto..."
    make clean >/dev/null 2>&1 || true
    make
    print_info "Compilação concluída com sucesso!"
}

create_pipes() {
    print_info "Criando pipes para comunicação com clientes..."
    
    rm -f "$CLIENT1_PIPE" "$CLIENT2_PIPE" "$CLIENT3_PIPE" 2>/dev/null || true
    
    mkfifo "$CLIENT1_PIPE"
    mkfifo "$CLIENT2_PIPE"
    mkfifo "$CLIENT3_PIPE"
    
    print_info "Pipes criados com sucesso!"
}

start_hub() {
    print_info "Iniciando o Hub em um novo terminal..."
    
    rm -f "$SOCKET_PATH" 2>/dev/null || true
    
    case "$TERMINAL_CMD" in
        "xterm")
            xterm -title "Hub - Comunicação" -geometry 80x25+0+0 -e bash -c "
                echo -e '${GREEN}HUB INICIADO${NC}';
                echo 'Socket: $SOCKET_PATH';
                echo '----------------------------------------';
                ./comunicacao hub $SOCKET_PATH;
                echo;
                echo -e '${RED}Hub finalizado. Pressione ENTER para fechar.${NC}';
                read
            " &
            HUB_PID=$!
            ;;
        "konsole")
            konsole --title "Hub - Comunicação" --geometry 80x25+0+0 -e bash -c "
                echo -e '${GREEN}HUB INICIADO${NC}';
                echo 'Socket: $SOCKET_PATH';
                echo '----------------------------------------';
                ./comunicacao hub $SOCKET_PATH;
                echo;
                echo -e '${RED}Hub finalizado. Pressione ENTER para fechar.${NC}';
                read
            " &
            HUB_PID=$!
            ;;
        "gnome-terminal")
            gnome-terminal --title="Hub - Comunicação" --geometry=80x25+0+0 -- bash -c "
                echo -e '${GREEN}HUB INICIADO${NC}';
                echo 'Socket: $SOCKET_PATH';
                echo '----------------------------------------';
                ./comunicacao hub $SOCKET_PATH;
                echo;
                echo -e '${RED}Hub finalizado. Pressione ENTER para fechar.${NC}';
                read
            " &
            HUB_PID=$!
            ;;
    esac
    
    sleep 3
    
    local attempts=0
    while [ ! -S "$SOCKET_PATH" ] && [ $attempts -lt 15 ]; do
        sleep 1
        attempts=$((attempts + 1))
    done
    
    if [ ! -S "$SOCKET_PATH" ]; then
        echo -e "${RED}ERRO: Hub não foi iniciado corretamente!${NC}"
        echo "Verifique se o executável './comunicacao' existe e funciona."
        exit 1
    fi
    
    print_info "Hub iniciado com sucesso!"
}

start_client() {
    local client_id=$1
    local address=$2
    local pipe_path=$3
    
    print_info "Iniciando Cliente $client_id (endereço $address)..."
    
    local x_pos=$((300 + client_id * 400))
    
    case "$TERMINAL_CMD" in
        "xterm")
            xterm -title "Cliente $client_id (Addr: $address)" -geometry 80x35+${x_pos}+0 -e bash -c "
                echo -e '${GREEN}CLIENTE $client_id INICIADO${NC}';
                echo 'Endereço: $address';
                echo '----------------------------------------';
                
                # Inicia o cliente em background e redireciona entrada do pipe
                tail -f '$pipe_path' | ./comunicacao client '$SOCKET_PATH' $address &
                CLIENT_PID=\$!
                
                # Aguarda o cliente terminar ou ser morto
                wait \$CLIENT_PID 2>/dev/null || true
                
                echo;
                echo -e '${RED}Cliente $client_id finalizado. Pressione ENTER para fechar.${NC}';
                read
            " &
            
            if [ $client_id -eq 1 ]; then
                CLIENT1_PID=$!
            elif [ $client_id -eq 2 ]; then
                CLIENT2_PID=$!
            else
                CLIENT3_PID=$!
            fi
            ;;
        "konsole")
            konsole --title "Cliente $client_id (Addr: $address)" --geometry 80x35+${x_pos}+0 -e bash -c "
                echo -e '${GREEN}CLIENTE $client_id INICIADO${NC}';
                echo 'Endereço: $address';
                echo '----------------------------------------';
                
                # Inicia o cliente em background e redireciona entrada do pipe
                tail -f '$pipe_path' | ./comunicacao client '$SOCKET_PATH' $address &
                CLIENT_PID=\$!
                
                # Aguarda o cliente terminar ou ser morto
                wait \$CLIENT_PID 2>/dev/null || true
                
                echo;
                echo -e '${RED}Cliente $client_id finalizado. Pressione ENTER para fechar.${NC}';
                read
            " &
            
            if [ $client_id -eq 1 ]; then
                CLIENT1_PID=$!
            elif [ $client_id -eq 2 ]; then
                CLIENT2_PID=$!
            else
                CLIENT3_PID=$!
            fi
            ;;
        "gnome-terminal")
            gnome-terminal --title="Cliente $client_id (Addr: $address)" --geometry=80x35+${x_pos}+0 -- bash -c "
                echo -e '${GREEN}CLIENTE $client_id INICIADO${NC}';
                echo 'Endereço: $address';
                echo '----------------------------------------';
                
                # Inicia o cliente em background e redireciona entrada do pipe
                tail -f '$pipe_path' | ./comunicacao client '$SOCKET_PATH' $address &
                CLIENT_PID=\$!
                
                # Aguarda o cliente terminar ou ser morto
                wait \$CLIENT_PID 2>/dev/null || true
                
                echo;
                echo -e '${RED}Cliente $client_id finalizado. Pressione ENTER para fechar.${NC}';
                read
            " &
            
            if [ $client_id -eq 1 ]; then
                CLIENT1_PID=$!
            elif [ $client_id -eq 2 ]; then
                CLIENT2_PID=$!
            else
                CLIENT3_PID=$!
            fi
            ;;
    esac
    
    sleep 2
    print_info "Cliente $client_id iniciado!"
}

send_command() {
    local client_pipe=$1
    local command="$2"
    local description="$3"
    
    echo -e "${BLUE}$description${NC}"
    
    echo "$command" > "$client_pipe"
    
    sleep 1
    
    echo
}

wait_and_continue() {
    local description="$1"
    if [ ! -z "$description" ]; then
        echo -e "${YELLOW}$description${NC}"
    fi
    echo -e "${YELLOW}Pressione ENTER para continuar...${NC}"
    read
    echo
}

main() {
    clear
    print_header
    
    print_step "1" "Compilação do Projeto"
    compile_project
    
    print_step "2" "Criando Pipes de Comunicação"
    create_pipes
    
    print_step "3" "Iniciando o Hub"
    start_hub
    
    print_step "4" "Iniciando Cliente 1 (endereço 10)"
    start_client 1 10 "$CLIENT1_PIPE"
    
    print_step "5" "Iniciando Cliente 2 (endereço 20)"
    start_client 2 20 "$CLIENT2_PIPE"
    
    print_step "6" "Iniciando Cliente 3 (endereço 30)"
    start_client 3 30 "$CLIENT3_PIPE"
    
    print_step "7" "Aguardando estabilização das conexões"
    sleep 3
    
    print_step "8" "Comunicação Normal"
    send_command "$CLIENT1_PIPE" "send 20 Ola Cliente 2!" "Cliente 1 → Cliente 2"
    wait_and_continue
    
    print_step "9" "Resposta"
    send_command "$CLIENT2_PIPE" "send 10 Oi Cliente 1!" "Cliente 2 → Cliente 1"
    wait_and_continue
    
    print_step "10" "Comunicação com terceiro cliente"
    send_command "$CLIENT3_PIPE" "send 10 Ola pessoal!" "Cliente 3 → Cliente 1"
    wait_and_continue
    
    print_step "11" "Simulação de Corrupção"
    send_command "$CLIENT1_PIPE" "corrupted_probability 0.7" "Configurando corrupção em 30%"
    send_command "$CLIENT1_PIPE" "send 20 Mensagem com corrupcao simulada." "Cliente 1 → Cliente 2 (com erros)"
    wait_and_continue
    
    print_step "12" "Simulação de Perda de Frames"
    send_command "$CLIENT2_PIPE" "reset_errors" "Resetando erros"
    send_command "$CLIENT2_PIPE" "lost_frames 0.4" "Configurando perda em 40%"
    send_command "$CLIENT2_PIPE" "send 10 Frames podem ser perdidos." "Cliente 2 → Cliente 3 (com perdas)"
    wait_and_continue
    
    print_step "13" "Desabilitando ACKs"
    send_command "$CLIENT1_PIPE" "reset_errors" "Resetando erros"
    send_command "$CLIENT1_PIPE" "disable_ack" "Desabilitando ACKs"
    send_command "$CLIENT2_PIPE" "send 10 Sem ACK de resposta." "Cliente 2 → Cliente 1 (sem ACK)"
    wait_and_continue
    
    print_step "14" "Mensagem Longa"
    send_command "$CLIENT1_PIPE" "enable_ack" "Reabilitando ACKs"
    send_command "$CLIENT1_PIPE" "send 20 Esta e uma mensagem muito longa que sera fragmentada em multiplos frames para demonstrar o funcionamento da janela deslizante." "Cliente 1 → Cliente 2 (mensagem longa)"
    wait_and_continue
    
    print_step "15" "Comunicação Múltipla"
    send_command "$CLIENT1_PIPE" "reset_errors" "Resetando todos os erros"
    send_command "$CLIENT2_PIPE" "reset_errors" "Resetando todos os erros"
    send_command "$CLIENT3_PIPE" "reset_errors" "Resetando todos os erros"
    send_command "$CLIENT1_PIPE" "send 30 Teste final do Cliente 1." "Cliente 1 → Cliente 3"
    send_command "$CLIENT2_PIPE" "send 30 Teste final do Cliente 2." "Cliente 2 → Cliente 3"
    send_command "$CLIENT3_PIPE" "send 10 Recebido por todos!" "Cliente 3 → Cliente 1"
    wait_and_continue
    
    echo
    echo -e "${YELLOW}Pressione ENTER para encerrar...${NC}"
    read
    
    cleanup
    echo -e "${GREEN}Processos finalizados!${NC}"
}

TERMINAL_CMD=""

if command -v xterm &> /dev/null; then
    TERMINAL_CMD="xterm"
fi

if [ -z "$TERMINAL_CMD" ] && command -v konsole &> /dev/null; then
    TERMINAL_CMD="konsole"
fi

if [ -z "$TERMINAL_CMD" ] && command -v gnome-terminal &> /dev/null; then
    if gnome-terminal --version &>/dev/null 2>&1; then
        TERMINAL_CMD="gnome-terminal"
    fi
fi

if [ -z "$TERMINAL_CMD" ]; then
    echo -e "${RED}ERRO: Nenhum terminal compatível encontrado!${NC}"
    echo "Instale xterm (recomendado):"
    echo "  sudo apt install xterm"
    echo ""
    echo "Outras opções:"
    echo "  sudo apt install konsole"
    echo "  sudo apt install gnome-terminal"
    exit 1
fi

print_info "Usando terminal: $TERMINAL_CMD"

if ! command -v make &> /dev/null; then
    echo -e "${RED}ERRO: make não encontrado!${NC}"
    echo "Para Ubuntu/Debian: sudo apt install build-essential"
    exit 1
fi

if ! command -v g++ &> /dev/null; then
    echo -e "${RED}ERRO: g++ não encontrado!${NC}"
    echo "Para Ubuntu/Debian: sudo apt install build-essential"
    exit 1
fi

main
