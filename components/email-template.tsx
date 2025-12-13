interface EmailTemplateProps {
  firstName: string
  lastName: string
  bookingId: string
  date: string
  startTime: string
  endTime: string
  duration: string
  players: number
  activityType: string
  userType: string
  cancelToken?: string // Token per la cancellazione
  cancelUrl?: string // URL completo per la cancellazione
}

export function BookingConfirmationEmail({ 
  firstName, 
  lastName,
  bookingId,
  date,
  startTime,
  endTime,
  duration,
  players,
  activityType,
  userType,
  cancelToken,
  cancelUrl
}: EmailTemplateProps) {
  const formatActivityType = (type: string) => {
    switch (type) {
      case '9': return '9 buche'
      case '18': return '18 buche'
      case 'pratica': return 'Campo Pratica'
      case 'mini-giochi': return 'Mini-giochi'
      case 'lezione-maestro': return 'Lezione maestro'
      default: return type
    }
  }

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #ffffff; border-radius: 8px; padding: 30px; border: 1px solid #e2e8f0;">
        <div style="text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #0d9488;">
          <h1 style="color: #0d9488; margin: 0; font-size: 28px; font-weight: bold;">
            ✓ Prenotazione Confermata
          </h1>
          <p style="color: #64748b; margin-top: 8px; font-size: 14px;">
            Montecchia Performance Center
          </p>
        </div>

        <div style="margin-bottom: 30px;">
          <p style="font-size: 16px; margin: 0;">
            Ciao <strong>${firstName} ${lastName}</strong>,
          </p>
          <p style="font-size: 16px; margin: 10px 0 0 0; color: #475569;">
            La tua prenotazione sul simulatore TrackMan iO è stata confermata!
          </p>
        </div>

        <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; margin-bottom: 30px; border: 1px solid #e2e8f0;">
          <h2 style="color: #1e293b; font-size: 18px; margin: 0 0 15px 0; border-bottom: 2px solid #0d9488; padding-bottom: 10px;">
            Dettagli Prenotazione
          </h2>
          
          <div style="display: grid; gap: 12px;">
            <div>
              <span style="font-weight: 600; color: #475569;">ID Prenotazione:</span>
              <span style="margin-left: 8px; color: #1e293b;">${bookingId}</span>
            </div>
            <div>
              <span style="font-weight: 600; color: #475569;">Data:</span>
              <span style="margin-left: 8px; color: #1e293b;">${date}</span>
            </div>
            <div>
              <span style="font-weight: 600; color: #475569;">Orario:</span>
              <span style="margin-left: 8px; color: #1e293b;">${startTime} – ${endTime}</span>
            </div>
            <div>
              <span style="font-weight: 600; color: #475569;">Durata:</span>
              <span style="margin-left: 8px; color: #1e293b;">${duration}</span>
            </div>
            <div>
              <span style="font-weight: 600; color: #475569;">Giocatori:</span>
              <span style="margin-left: 8px; color: #1e293b;">${players}</span>
            </div>
            <div>
              <span style="font-weight: 600; color: #475569;">Attività:</span>
              <span style="margin-left: 8px; color: #1e293b;">${formatActivityType(activityType)}</span>
            </div>
            <div>
              <span style="font-weight: 600; color: #475569;">Tipo Utente:</span>
              <span style="margin-left: 8px; color: #1e293b; text-transform: capitalize;">${userType}</span>
            </div>
          </div>
        </div>

        <div style="background-color: #ecfdf5; border-radius: 8px; padding: 20px; margin-bottom: 30px; border: 1px solid #86efac;">
          <p style="margin: 0; font-size: 14px; color: #166534;">
            <strong>📍 Location:</strong> Montecchia Golf Club<br />
            Via Montecchia, 12, 35030 Selvazzano Dentro PD, Italia
          </p>
        </div>

        ${cancelUrl ? `
        <div style="text-align: center; margin-bottom: 30px; padding: 20px; background-color: #fef2f2; border-radius: 8px; border: 1px solid #fecaca;">
          <p style="margin: 0 0 12px 0; font-size: 14px; color: #991b1b;">
            <strong>Vuoi cancellare questa prenotazione?</strong>
          </p>
          <a href="${cancelUrl}" style="display: inline-block; padding: 12px 24px; background-color: #dc2626; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">
            Cancella Prenotazione
          </a>
          <p style="margin: 12px 0 0 0; font-size: 12px; color: #7f1d1d;">
            ⚠️ La cancellazione è possibile solo entro 24 ore prima dell'orario prenotato
          </p>
        </div>
        ` : ''}
        <div style="text-align: center; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 14px; color: #64748b;">
          <p style="margin: 0 0 8px 0;">
            Per domande o modifiche, contattaci all'indirizzo email fornito durante la registrazione.
          </p>
          <p style="margin: 8px 0 0 0; font-weight: 600; color: #0d9488;">
            Ci vediamo sul green! 🏌️
          </p>
        </div>
      </div>

      <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #94a3b8;">
        <p style="margin: 0;">
          Questa è un'email automatica. Si prega di non rispondere.
        </p>
      </div>
    </div>
  `
}

export function AdminNotificationEmail({ 
  firstName, 
  lastName,
  bookingId,
  date,
  startTime,
  endTime,
  duration,
  players,
  activityType,
  userType,
  email,
  phone
}: EmailTemplateProps & { email: string, phone?: string }) {
  const formatActivityType = (type: string) => {
    switch (type) {
      case '9': return '9 buche'
      case '18': return '18 buche'
      case 'pratica': return 'Campo Pratica'
      case 'mini-giochi': return 'Mini-giochi'
      case 'lezione-maestro': return 'Lezione maestro'
      default: return type
    }
  }

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #ffffff; border-radius: 8px; padding: 30px; border: 1px solid #e2e8f0;">
        <div style="text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #dc2626;">
          <h1 style="color: #dc2626; margin: 0; font-size: 28px; font-weight: bold;">
            📅 Nuova Prenotazione
          </h1>
          <p style="color: #64748b; margin-top: 8px; font-size: 14px;">
            Montecchia Performance Center
          </p>
        </div>

        <div style="margin-bottom: 30px;">
          <p style="font-size: 16px; margin: 0;">
            C'è una nuova prenotazione per il simulatore TrackMan iO.
          </p>
        </div>

        <div style="background-color: #fef2f2; border-radius: 8px; padding: 20px; margin-bottom: 20px; border: 1px solid #fecaca;">
          <h2 style="color: #1e293b; font-size: 18px; margin: 0 0 15px 0; border-bottom: 2px solid #dc2626; padding-bottom: 10px;">
            Dettagli Prenotazione
          </h2>
          
          <div style="display: grid; gap: 12px;">
            <div>
              <span style="font-weight: 600; color: #475569;">ID Prenotazione:</span>
              <span style="margin-left: 8px; color: #1e293b;">${bookingId}</span>
            </div>
            <div>
              <span style="font-weight: 600; color: #475569;">Data:</span>
              <span style="margin-left: 8px; color: #1e293b;">${date}</span>
            </div>
            <div>
              <span style="font-weight: 600; color: #475569;">Orario:</span>
              <span style="margin-left: 8px; color: #1e293b;">${startTime} – ${endTime}</span>
            </div>
            <div>
              <span style="font-weight: 600; color: #475569;">Durata:</span>
              <span style="margin-left: 8px; color: #1e293b;">${duration}</span>
            </div>
            <div>
              <span style="font-weight: 600; color: #475569;">Giocatori:</span>
              <span style="margin-left: 8px; color: #1e293b;">${players}</span>
            </div>
            <div>
              <span style="font-weight: 600; color: #475569;">Attività:</span>
              <span style="margin-left: 8px; color: #1e293b;">${formatActivityType(activityType)}</span>
            </div>
          </div>
        </div>

        <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; margin-bottom: 30px; border: 1px solid #e2e8f0;">
          <h2 style="color: #1e293b; font-size: 18px; margin: 0 0 15px 0; padding-bottom: 10px;">
            Dati Cliente
          </h2>
          
          <div style="display: grid; gap: 12px;">
            <div>
              <span style="font-weight: 600; color: #475569;">Nome:</span>
              <span style="margin-left: 8px; color: #1e293b;">${firstName} ${lastName}</span>
            </div>
            <div>
              <span style="font-weight: 600; color: #475569;">Email:</span>
              <span style="margin-left: 8px; color: #1e293b;">${email}</span>
            </div>
            ${phone ? `<div>
              <span style="font-weight: 600; color: #475569;">Telefono:</span>
              <span style="margin-left: 8px; color: #1e293b;">${phone}</span>
            </div>` : ''}
            <div>
              <span style="font-weight: 600; color: #475569;">Tipo Utente:</span>
              <span style="margin-left: 8px; color: #1e293b; text-transform: capitalize;">${userType}</span>
            </div>
          </div>
        </div>

        <div style="text-align: center; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 14px; color: #64748b;">
          <p style="margin: 0;">
            Prenotazione ricevuta automaticamente tramite il sistema online.
          </p>
        </div>
      </div>
    </div>
  `
}
