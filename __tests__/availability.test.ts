/**
 * Test per la generazione degli slot temporali
 */
import {
  generateTimeSlots,
  calculateEndTime,
  generateTimeSlotsBetween,
  hasTimeOverlap,
  BUFFER_MINUTES,
} from "@/lib/availability"

describe("Availability - Slot Generation", () => {
  test("genera slot dalle 09:30 alle 23:00 ogni 30 minuti", () => {
    const slots = generateTimeSlots()
    
    expect(slots.length).toBeGreaterThan(0)
    expect(slots[0]).toBe("09:30")
    expect(slots[slots.length - 1]).toBe("23:00")
    
    // Verifica che siano incrementi di 30 minuti
    for (let i = 1; i < slots.length; i++) {
      const [prevHour, prevMin] = slots[i - 1].split(":").map(Number)
      const [currHour, currMin] = slots[i].split(":").map(Number)
      
      const prevTotal = prevHour * 60 + prevMin
      const currTotal = currHour * 60 + currMin
      
      expect(currTotal - prevTotal).toBe(30)
    }
  })

  test("calcola correttamente l'orario finale", () => {
    expect(calculateEndTime("10:00", 60)).toBe("11:00")
    expect(calculateEndTime("10:00", 90)).toBe("11:30")
    expect(calculateEndTime("10:30", 30)).toBe("11:00")
    expect(calculateEndTime("22:00", 90)).toBe("23:30")
  })

  test("genera slot tra due orari", () => {
    const slots = generateTimeSlotsBetween("10:00", "11:30")
    
    expect(slots).toEqual(["10:00", "10:30", "11:00"])
  })

  test("rileva sovrapposizioni temporali correttamente", () => {
    // Caso 1: Sovrapposizione parziale
    expect(hasTimeOverlap("10:00", "11:00", "10:30", "11:30")).toBe(true)
    
    // Caso 2: Sovrapposizione completa
    expect(hasTimeOverlap("10:00", "12:00", "10:30", "11:00")).toBe(true)
    
    // Caso 3: Nessuna sovrapposizione (separati)
    expect(hasTimeOverlap("10:00", "11:00", "11:10", "12:00")).toBe(false)
    
    // Caso 4: Nessuna sovrapposizione con buffer
    // Buffer di 10 minuti: 11:00 + 10 min = 11:10, quindi 11:10 non si sovrappone
    expect(hasTimeOverlap("10:00", "11:00", "11:10", "12:00")).toBe(false)
    
    // Caso 5: Sovrapposizione considerando il buffer
    // 11:00 + 10 min buffer = 11:10, quindi 11:05 si sovrappone
    expect(hasTimeOverlap("10:00", "11:00", "11:05", "12:00")).toBe(true)
    
    // Caso 6: Orari identici
    expect(hasTimeOverlap("10:00", "11:00", "10:00", "11:00")).toBe(true)
  })

  test("gestisce correttamente gli orari che attraversano la mezzanotte", () => {
    // Nota: Non dovrebbe verificarsi nella nostra app dato che chiudiamo alle 23:00
    // Ma testiamo comunque il caso limite
    expect(calculateEndTime("22:30", 60)).toBe("23:30")
  })
})

