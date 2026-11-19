package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"sync"
	"time"
)

// Estructura de un Ticket de Venta
type Ticket struct {
	ID           string  `json:"id"`
	SucursalID   int     `json:"sucursal_id"`
	CajaID       int     `json:"caja_id"`
	Total        float64 `json:"total"`
	MetodoPago   string  `json:"metodo_pago"`
	Fecha        string  `json:"fecha"`
	Sincronizado bool    `json:"-"`
}

// Canal (Cola) para absorber miles de peticiones sin trabar el servidor (Simulando Kafka local)
var ticketQueue = make(chan Ticket, 100000)

func main() {
	// Iniciar Workers en segundo plano (Procesan tickets en paralelo)
	go ticketWorker()
	go ticketWorker() // Podemos abrir 10 o 50 workers dependiendo del CPU

	// Rutas de nuestra API REST
	http.HandleFunc("/api/v1/sync/tickets", handleSyncTickets)
	http.HandleFunc("/api/v1/health", handleHealthCheck)

	fmt.Println("🚀 NEXUS ENTERPRISE SERVER iniciado en el puerto 8080...")
	fmt.Println("Esperando conexiones de las 3,000 sucursales...")
	
	// Iniciar servidor web
	log.Fatal(http.ListenAndServe(":8080", nil))
}

// Endpoint que reciben las Cajas cuando tienen internet
func handleSyncTickets(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "Método no permitido", http.StatusMethodNotAllowed)
		return
	}

	var tickets []Ticket
	if err := json.NewDecoder(r.Body).Decode(&tickets); err != nil {
		http.Error(w, "Error leyendo los tickets", http.StatusBadRequest)
		return
	}

	// Enviar todos los tickets a la cola de manera asíncrona (Toma milisegundos)
	for _, t := range tickets {
		ticketQueue <- t
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusAccepted) // 202 Accepted
	w.Write([]byte(`{"status": "success", "message": "Tickets encolados exitosamente"}`))
}

// Worker que procesa la cola y guarda en Base de Datos (PostgreSQL)
func ticketWorker() {
	for ticket := range ticketQueue {
		// Aquí iría el código real para guardar en PostgreSQL de forma masiva (Bulk Insert)
		// Simulamos el guardado...
		time.Sleep(10 * time.Millisecond) 
		fmt.Printf("[WORKER] ✅ Ticket %s de la sucursal %d guardado en DB Central.\n", ticket.ID, ticket.SucursalID)
	}
}

// Endpoint para monitoreo de salud del servidor
func handleHealthCheck(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusOK)
	w.Write([]byte("NEXUS SERVER OK - LISTO PARA RECIBIR TRANSACCIONES"))
}
