
(function() {
  'use strict';

  const STORAGE_KEYS = {
    usuarios: 'usuarios',
    usuarioActivo: 'usuarioActivo',
    usuarioRecordado: 'usuarioRecordado',
    historialAccesos: 'historialAccesos'
  };

  const DEMO_USERS = [
    {
      id: 1,
      nombre: 'Director General',
      email: 'director@lab.es',
      password: 'admin123',
      perfil: 'director',
      empresa: 'Laboratorio Quimico',
      fechaRegistro: new Date().toLocaleString('es-CL')
    },
    {
      id: 2,
      nombre: 'Técnico Principal',
      email: 'tecnico@lab.es',
      password: 'tech123',
      perfil: 'tecnico',
      empresa: 'Laboratorio Quimico',
      fechaRegistro: new Date().toLocaleString('es-CL')
    },
    {
      id: 3,
      nombre: 'Cliente',
      email: 'cliente@lab.es',
      password: 'cliente123',
      perfil: 'cliente',
      empresa: 'Empresa Cliente S.A.',
      fechaRegistro: new Date().toLocaleString('es-CL')
    }
  ];

  const DATOS_EMPRESA = {
    personas: [
      { nombre: 'Gean Carlos', cargo: 'Director del laboratorio', tarea: 'Coordina el trabajo y supervisa cada proyecto.' }
    ],
    servicios: [
      { id: 1, nombre: 'Análisis de Agua', precio: 90000, tiempo: '3-5 días', descripcion: 'Análisis completo de calidad del agua', parametros: 12, volumenMinimo: 250 },
      { id: 2, nombre: 'Análisis de Suelo', precio: 130000, tiempo: '5-7 días', descripcion: 'Evaluación de composición y pH del suelo', parametros: 15, volumenMinimo: 500 },
      { id: 3, nombre: 'Análisis de Metales', precio: 160000, tiempo: '4-6 días', descripcion: 'Detección de metales pesados', parametros: 10, volumenMinimo: 100 },
      { id: 4, nombre: 'Análisis Orgánico', precio: 190000, tiempo: '7-10 días', descripcion: 'Determinación de compuestos orgánicos', parametros: 20, volumenMinimo: 200 },
      { id: 5, nombre: 'Análisis Microbiológico', precio: 100000, tiempo: '2-3 días', descripcion: 'Cultivo e identificación de microorganismos', parametros: 8, volumenMinimo: 100 },
      { id: 6, nombre: 'Análisis de pH y Alcalinidad', precio: 42000, tiempo: '1 día', descripcion: 'Medición rápida de pH y alcalinidad total', parametros: 3, volumenMinimo: 50 }
    ],
  };

  const Auth = {
    initUsers: function() {
      const usuariosGuardados = localStorage.getItem(STORAGE_KEYS.usuarios);
      if (!usuariosGuardados) {
        localStorage.setItem(STORAGE_KEYS.usuarios, JSON.stringify(DEMO_USERS));
      }
    },
    getActiveUser: function() {
      const usuarioJson = sessionStorage.getItem(STORAGE_KEYS.usuarioActivo);
      if (!usuarioJson) return null;
      try {
        return JSON.parse(usuarioJson);
      } catch (error) {
        sessionStorage.removeItem(STORAGE_KEYS.usuarioActivo);
        return null;
      }
    },
    isLoggedIn: function() {
      return this.getActiveUser() !== null;
    },
    login: function(usuario) {
      sessionStorage.setItem(STORAGE_KEYS.usuarioActivo, JSON.stringify(usuario));
    },
    logout: function() {
      sessionStorage.removeItem(STORAGE_KEYS.usuarioActivo);
      localStorage.removeItem(STORAGE_KEYS.usuarioRecordado);
    },
    registerAccess: function(accion, detalles) {
      const usuario = this.getActiveUser();
      if (!usuario) return;

      const historial = readStorageArray(STORAGE_KEYS.historialAccesos);
      const entrada = {
        id: historial.length + 1,
        usuarioId: usuario.id,
        usuarioNombre: usuario.nombre,
        usuarioPerfil: usuario.perfil,
        accion: accion,
        detalles: detalles || '',
        timestamp: new Date().toLocaleString('es-CL'),
        url: window.location.pathname
      };

      historial.push(entrada);
      localStorage.setItem(STORAGE_KEYS.historialAccesos, JSON.stringify(historial));
    }
  };

  function getCurrentPageName() {
    return window.location.pathname.split('/').pop().toLowerCase();
  }

  function isLoginPage() {
    return getCurrentPageName() === 'login.html';
  }

  function safeGetById(id) {
    return document.getElementById(id);
  }

  function readStorageArray(key) {
    try {
      const value = JSON.parse(localStorage.getItem(key) || '[]');
      return Array.isArray(value) ? value : [];
    } catch (error) {
      return [];
    }
  }

  function setText(id, value) {
    const element = safeGetById(id);
    if (element) element.textContent = value;
  }

  function setupMenu() {
    document.querySelectorAll('.menu-toggle').forEach(function(button) {
      button.addEventListener('click', function() {
        const menuId = button.getAttribute('aria-controls');
        const menu = menuId ? document.getElementById(menuId) : null;
        if (!menu) return;

        const isOpen = button.getAttribute('aria-expanded') === 'true';
        button.setAttribute('aria-expanded', String(!isOpen));
        menu.classList.toggle('is-open', !isOpen);
      });
    });

    document.querySelectorAll('.main-nav a').forEach(function(link) {
      link.addEventListener('click', function() {
        const nav = link.closest('nav');
        if (!nav) return;

        const button = document.querySelector('[aria-controls="' + nav.id + '"]');
        if (button) {
          button.setAttribute('aria-expanded', 'false');
        }
        nav.classList.remove('is-open');
      });
    });
  }

  function sanitizeText(value, maxLength) {
    const cleanValue = String(value ?? '').replace(/[<>]/g, '').trim();
    if (!maxLength) return cleanValue;
    return cleanValue.slice(0, maxLength);
  }

  function parsePositiveNumber(value, label, options) {
    const config = Object.assign({ min: 0, max: Number.MAX_SAFE_INTEGER, allowZero: false }, options || {});
    const text = String(value ?? '').trim();

    if (text === '') {
      return { valid: false, message: label + ' es obligatorio.' };
    }

    if (!/^-?(?:\d+(?:[.,]\d+)?|[.,]\d+)$/.test(text)) {
      return { valid: false, message: label + ' debe contener solo números.' };
    }

    const number = Number(text.replace(',', '.'));

    if (!Number.isFinite(number)) {
      return { valid: false, message: label + ' debe ser un número válido.' };
    }
    if (number < config.min || (config.allowZero ? number < 0 : number <= 0)) {
      return { valid: false, message: label + (config.allowZero ? ' no puede ser negativo.' : ' debe ser mayor que 0.') };
    }
    if (number > config.max) {
      return { valid: false, message: label + ' supera el valor máximo permitido.' };
    }

    return { valid: true, value: number };
  }

  function validateLoginForm(email, password) {
    const sanitizedEmail = sanitizeText(email, 120).toLowerCase();
    const sanitizedPassword = sanitizeText(password, 80);
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    if (!emailPattern.test(sanitizedEmail)) {
      return { valid: false, message: 'Introduce un correo electrónico válido.' };
    }
    if (sanitizedPassword.length < 6 || sanitizedPassword.length > 80) {
      return { valid: false, message: 'La contraseña debe tener entre 6 y 80 caracteres.' };
    }

    return {
      valid: true,
      data: {
        email: sanitizedEmail,
        password: sanitizedPassword
      }
    };
  }

  function setupLoginPage() {
    const formLogin = safeGetById('form-login');
    const emailLoginField = safeGetById('email-login');
    const btnDemo = safeGetById('btn-demo');
    const demoUsuarios = safeGetById('demo-usuarios');
    const usuarioRecordado = localStorage.getItem(STORAGE_KEYS.usuarioRecordado);

    if (emailLoginField && usuarioRecordado) {
      emailLoginField.value = sanitizeText(usuarioRecordado, 120);
    }

    if (btnDemo && demoUsuarios) {
      btnDemo.addEventListener('click', function(e) {
        e.preventDefault();
        demoUsuarios.hidden = !demoUsuarios.hidden;
      });
    }

    if (!formLogin) return;

    formLogin.addEventListener('submit', function(e) {
      e.preventDefault();

      const emailInput = safeGetById('email-login');
      const passwordInput = safeGetById('password-login');
      const recuerda = safeGetById('recuerda') ? safeGetById('recuerda').checked : false;
      const mensajeDiv = safeGetById('mensaje-login');

      if (!emailInput || !passwordInput || !mensajeDiv) return;

      const validation = validateLoginForm(emailInput.value, passwordInput.value);
      if (!validation.valid) {
        mensajeDiv.textContent = validation.message;
        mensajeDiv.className = 'mensaje-login error';
        mensajeDiv.hidden = false;
        return;
      }

      const usuarios = readStorageArray(STORAGE_KEYS.usuarios);
      const usuarioEncontrado = usuarios.find(function(usuario) {
        return usuario.email === validation.data.email && usuario.password === validation.data.password;
      });

      if (!usuarioEncontrado) {
        mensajeDiv.textContent = 'Correo o contraseña incorrectos. Inténtalo de nuevo.';
        mensajeDiv.className = 'mensaje-login error';
        mensajeDiv.hidden = false;
        return;
      }

      Auth.login(usuarioEncontrado);

      if (recuerda) {
        localStorage.setItem(STORAGE_KEYS.usuarioRecordado, validation.data.email);
      }

      Auth.registerAccess('LOGIN', 'Sesión iniciada desde login.html');
      const nombreMostrar = usuarioEncontrado.perfil === 'cliente' ? 'Cliente' : usuarioEncontrado.nombre;
      mensajeDiv.textContent = 'Bienvenido/a ' + nombreMostrar + '. Redirigiendo...';
      mensajeDiv.className = 'mensaje-login exito';
      mensajeDiv.hidden = false;

      setTimeout(function() {
        window.location.replace('index.html');
      }, 1200);
    });
  }

  function addPanelLinkAndLogout() {
    const navMenu = document.querySelector('.main-nav');
    if (!navMenu) return;

    if (!navMenu.querySelector('a[href="panel.html"]')) {
      const linkPanel = document.createElement('a');
      linkPanel.href = 'panel.html';
      linkPanel.textContent = 'Panel';
      linkPanel.className = 'panel-link';
      navMenu.appendChild(linkPanel);
    }

    if (!navMenu.querySelector('a[data-action="logout"]')) {
      const linkLogout = document.createElement('a');
      linkLogout.href = '#';
      linkLogout.textContent = 'Salir';
      linkLogout.setAttribute('data-action', 'logout');
      linkLogout.className = 'logout-link';
      linkLogout.addEventListener('click', function(e) {
        e.preventDefault();
        if (confirm('¿Deseas cerrar sesión?')) {
          Auth.registerAccess('LOGOUT', 'Sesión cerrada');
          Auth.logout();
          window.location.replace('login.html');
        }
      });
      navMenu.appendChild(linkLogout);
    }
  }

  function renderTeam() {
    const tarjetasEquipo = safeGetById('tarjetas-equipo');
    if (!tarjetasEquipo) return;

    tarjetasEquipo.replaceChildren();
    DATOS_EMPRESA.personas.forEach(function(persona) {
      const tarjeta = document.createElement('article');
      const nombre = document.createElement('h3');
      const cargo = document.createElement('p');
      const tarea = document.createElement('p');

      tarjeta.className = 'team-card';
      nombre.textContent = persona.nombre;
      cargo.textContent = persona.cargo;
      tarea.textContent = persona.tarea;

      tarjeta.appendChild(nombre);
      tarjeta.appendChild(cargo);
      tarjeta.appendChild(tarea);
      tarjetasEquipo.appendChild(tarjeta);
    });
  }

  function setupBudget() {
    const serviciosContainer = safeGetById('servicios-container');
    if (!serviciosContainer) return;

    const serviciosSeleccionados = {};

    DATOS_EMPRESA.servicios.forEach(function(servicio) {
      const tarjeta = document.createElement('div');
      tarjeta.className = 'service-card';
      tarjeta.dataset.servicioId = servicio.id;

      tarjeta.innerHTML = [
        '<h3>' + servicio.nombre + '</h3>',
        '<p class="precio">CLP $' + servicio.precio.toLocaleString('es-CL') + '</p>',
        '<p class="descripcion">' + servicio.descripcion + '</p>',
        '<p class="tiempo">' + servicio.tiempo + '</p>',
        '<div class="detalles">',
        '<p><strong>Parámetros analizados:</strong> ' + servicio.parametros + '</p>',
        '<p><strong>Volumen mínimo:</strong> ' + servicio.volumenMinimo + ' ml</p>',
        '<button class="btn-add">Agregar al presupuesto</button>',
        '</div>'
      ].join('');

      tarjeta.addEventListener('click', function(e) {
        if (e.target.classList.contains('btn-add')) return;
        tarjeta.classList.toggle('activa');
      });

      const btnAgregar = tarjeta.querySelector('.btn-add');
      btnAgregar.addEventListener('click', function(e) {
        e.stopPropagation();
        if (serviciosSeleccionados[servicio.id]) {
          delete serviciosSeleccionados[servicio.id];
          tarjeta.classList.remove('seleccionada');
          btnAgregar.textContent = 'Agregar al presupuesto';
        } else {
          serviciosSeleccionados[servicio.id] = servicio;
          tarjeta.classList.add('seleccionada');
          btnAgregar.textContent = 'Agregado';
        }
        updateBudget(serviciosSeleccionados);
      });

      serviciosContainer.appendChild(tarjeta);
    });

    const btnResetear = safeGetById('btn-resetear');
    const btnContratar = safeGetById('btn-contratar');
    const confirmacionContratacion = safeGetById('confirmacion-contratacion');

    if (btnContratar) {
      btnContratar.addEventListener('click', function() {
        const cantidad = Object.keys(serviciosSeleccionados).length;
        if (cantidad === 0 || !confirmacionContratacion) return;

        const precioFinal = Object.keys(serviciosSeleccionados).reduce(function(total, id) {
          return total + serviciosSeleccionados[id].precio;
        }, 0) * (cantidad >= 3 ? 0.9 : 1);

        confirmacionContratacion.textContent = 'Solicitud registrada por ' + precioFinal.toLocaleString('es-CL') + ' CLP. Te contactaremos para confirmar muestras, plazos y forma de pago.';
        confirmacionContratacion.hidden = false;
        Auth.registerAccess('SOLICITUD_SERVICIO', cantidad + ' análisis solicitados');
        btnContratar.disabled = true;
        btnContratar.textContent = 'Solicitud enviada';
      });
    }

    if (btnResetear) {
      btnResetear.addEventListener('click', function() {
        Object.keys(serviciosSeleccionados).forEach(function(id) {
          delete serviciosSeleccionados[id];
        });

        document.querySelectorAll('.service-card').forEach(function(tarjeta) {
          tarjeta.classList.remove('seleccionada', 'activa');
          const btn = tarjeta.querySelector('.btn-add');
          if (btn) btn.textContent = 'Agregar al presupuesto';
        });
        if (btnContratar) {
          btnContratar.disabled = true;
          btnContratar.textContent = 'Contratar análisis';
        }
        if (confirmacionContratacion) confirmacionContratacion.hidden = true;
        updateBudget(serviciosSeleccionados);
      });
    }

    updateBudget(serviciosSeleccionados);
  }

  function updateBudget(serviciosSeleccionados) {
    const serviciosIds = Object.keys(serviciosSeleccionados);
    const cantidad = serviciosIds.length;
    let costoTotal = 0;

    serviciosIds.forEach(function(id) {
      costoTotal += serviciosSeleccionados[id].precio;
    });

    const descuento = cantidad >= 3 ? costoTotal * 0.1 : 0;
    const precioFinal = costoTotal - descuento;

    const serviciosSeleccionadosEl = safeGetById('servicios-seleccionados');
    const costoTotalEl = safeGetById('costo-total');
    const precioFinalEl = safeGetById('precio-final');
    const descuentoEl = safeGetById('descuento-aplicado');
    const valorDescuentoEl = safeGetById('valor-descuento');

    if (serviciosSeleccionadosEl) serviciosSeleccionadosEl.textContent = 'Servicios seleccionados: ' + cantidad;
    if (costoTotalEl) costoTotalEl.textContent = 'Costo total estimado: CLP $' + costoTotal.toLocaleString('es-CL');
    if (precioFinalEl) precioFinalEl.textContent = 'Precio final: CLP $' + precioFinal.toLocaleString('es-CL');

    const btnContratar = safeGetById('btn-contratar');
    if (btnContratar) btnContratar.disabled = cantidad === 0;

    if (descuentoEl && valorDescuentoEl) {
      if (cantidad >= 3) {
        descuentoEl.hidden = false;
        valorDescuentoEl.textContent = descuento.toLocaleString('es-CL');
      } else {
        descuentoEl.hidden = true;
      }
    }
  }

  function setupMixCalculator() {
    const formMezcla = safeGetById('form-mezcla');
    if (!formMezcla) return;

    formMezcla.addEventListener('submit', function(event) {
      event.preventDefault();

      const cantidadA = parsePositiveNumber(safeGetById('componente-a').value, 'La cantidad del reactivo ácido', { max: 500, allowZero: true });
      const cantidadB = parsePositiveNumber(safeGetById('componente-b').value, 'La cantidad del reactivo base', { max: 500, allowZero: true });
      const phA = parsePositiveNumber(safeGetById('ph-a').value, 'El pH del reactivo ácido', { max: 14, allowZero: true });
      const phB = parsePositiveNumber(safeGetById('ph-b').value, 'El pH del reactivo base', { max: 14, allowZero: true });
      const total = (cantidadA.valid ? cantidadA.value : 0) + (cantidadB.valid ? cantidadB.value : 0);
      const resultado = safeGetById('resultado-mezcla');
      const advertencia = safeGetById('advertencia-ph');

      const cantidadesValidas = cantidadA.valid && cantidadB.valid && total > 0;
      const phValido = phA.valid && phB.valid;
      if (!cantidadesValidas || !phValido) {
        const primerError = [cantidadA, cantidadB, phA, phB].find(function(campo) {
          return !campo.valid;
        });
        resultado.textContent = primerError ? primerError.message : 'Las cantidades deben sumar más de 0 ml.';
        resultado.className = 'mix-result error';
        if (advertencia) advertencia.hidden = true;
        return;
      }

      const concentracionA = Math.pow(10, -phA.value);
      const concentracionB = Math.pow(10, -phB.value);
      const concentracionFinal = ((cantidadA.value * concentracionA) + (cantidadB.value * concentracionB)) / total;
      const phFinal = -Math.log10(concentracionFinal);

      resultado.textContent = 'Volumen total: ' + total.toFixed(1) + ' ml. pH estimado de la mezcla: ' + phFinal.toFixed(2) + '.';

      if (phFinal < 4 || phFinal > 10) {
        if (advertencia) {
          advertencia.textContent = 'Advertencia: el pH estimado está fuera del rango recomendado (4-10). Revisa la mezcla y utiliza protección adecuada.';
          advertencia.hidden = false;
        }
      } else if (advertencia) {
        advertencia.textContent = '';
        advertencia.hidden = true;
      }
    });
  }

  function setupGoogleAdsCalculator() {
    const formGoogleAds = safeGetById('form-google-ads');
    if (!formGoogleAds) return;

    formGoogleAds.addEventListener('submit', function(event) {
      event.preventDefault();

      const presupuesto = parsePositiveNumber(safeGetById('presupuesto-mensual').value, 'El presupuesto mensual', { max: 1000000000 });
      const cpc = parsePositiveNumber(safeGetById('cpc-google').value, 'El coste por clic', { max: 50000 });
      const ctr = parsePositiveNumber(safeGetById('ctr-google').value, 'El CTR', { max: 100 });
      const tasaConversion = parsePositiveNumber(safeGetById('tasa-conversion-google').value, 'La tasa de conversión', { max: 100 });
      const valorConversion = parsePositiveNumber(safeGetById('valor-conversion-google').value, 'El valor por conversión', { max: 1000000000 });
      const resultado = safeGetById('resultado-google-ads');

      if (!resultado) return;
      if (!presupuesto.valid || !cpc.valid || !ctr.valid || !tasaConversion.valid || !valorConversion.valid) {
        const firstError = [presupuesto, cpc, ctr, tasaConversion, valorConversion].find(function(item) {
          return !item.valid;
        });
        resultado.textContent = firstError ? firstError.message : 'Revisa los datos del cálculo.';
        resultado.className = 'resultado-mezcla error';
        return;
      }

      const clicsEstimados = presupuesto.value / cpc.value;
      const impresionesEstimadas = clicsEstimados / (ctr.value / 100);
      const conversionesEstimadas = clicsEstimados * (tasaConversion.value / 100);
      const ingresosEstimados = conversionesEstimadas * valorConversion.value;
      const roi = ((ingresosEstimados - presupuesto.value) / presupuesto.value) * 100;
      const costoPorConversion = presupuesto.value / Math.max(conversionesEstimadas, 1);

      resultado.className = 'resultado-mezcla';
      resultado.textContent = 'Clics estimados: ' + clicsEstimados.toLocaleString('es-CL', { maximumFractionDigits: 0 }) +
        '. Impresiones: ' + impresionesEstimadas.toLocaleString('es-CL', { maximumFractionDigits: 0 }) +
        '. Conversiones: ' + conversionesEstimadas.toLocaleString('es-CL', { maximumFractionDigits: 2 }) +
        '. Ingresos estimados: CLP $' + ingresosEstimados.toLocaleString('es-CL', { maximumFractionDigits: 0 }) +
        '. ROI estimado: ' + roi.toFixed(1) + '%.' +
        ' Costo por conversión: CLP $' + costoPorConversion.toLocaleString('es-CL', { maximumFractionDigits: 0 }) + '.';
    });
  }

  function setupContactForm() {
    const formContacto = safeGetById('form-contacto');
    if (!formContacto) return;

    formContacto.addEventListener('submit', function(event) {
      event.preventDefault();

      const nombre = safeGetById('nombre').value.trim();
      const email = safeGetById('email').value.trim();
      const confirmacion = safeGetById('confirmacion-envio');

      if (!confirmacion) return;

      confirmacion.textContent = 'Gracias, ' + nombre + '. Tu mensaje ha sido enviado correctamente. Nos pondremos en contacto pronto a través de ' + email + '.';
      confirmacion.hidden = false;
      formContacto.reset();

      setTimeout(function() {
        confirmacion.hidden = true;
      }, 5000);
    });
  }

  function setupAccordions() {
    document.querySelectorAll('.accordion-toggle').forEach(function(button) {
      button.addEventListener('click', function() {
        const panel = button.closest('.accordion-item');
        if (!panel) return;

        const isOpen = panel.classList.contains('is-open');

        document.querySelectorAll('.accordion-item.is-open').forEach(function(openPanel) {
          if (openPanel === panel) return;

          openPanel.classList.remove('is-open');
          const openButton = openPanel.querySelector('.accordion-toggle');
          const openIcon = openPanel.querySelector('.accordion-icon');
          if (openButton) openButton.setAttribute('aria-expanded', 'false');
          if (openIcon) openIcon.textContent = '+';
        });

        panel.classList.toggle('is-open', !isOpen);
        button.setAttribute('aria-expanded', String(!isOpen));
        const icon = button.querySelector('.accordion-icon');
        if (icon) {
          icon.textContent = !isOpen ? '−' : '+';
        }
      });
    });
  }

  function renderPanel() {
    const userNameEl = safeGetById('usuario-nombre');
    if (!userNameEl) return;

    const usuario = Auth.getActiveUser();
    if (!usuario) {
      window.location.replace('login.html');
      return;
    }

    document.getElementById('usuario-nombre').textContent = usuario.nombre;
    document.getElementById('usuario-email').textContent = usuario.email;
    document.getElementById('usuario-perfil').textContent = usuario.perfil.toUpperCase();
    document.getElementById('usuario-perfil').className = 'badge-perfil badge-' + usuario.perfil;
    document.getElementById('usuario-empresa').textContent = usuario.empresa;
    document.getElementById('usuario-registro').textContent = usuario.fechaRegistro;

    const btnLogout = safeGetById('btn-logout');
    if (btnLogout) {
      btnLogout.addEventListener('click', function() {
        if (confirm('¿Deseas cerrar sesión?')) {
          Auth.registerAccess('LOGOUT', 'Sesión cerrada');
          Auth.logout();
          window.location.replace('login.html');
        }
      });
    }

    if (usuario.perfil === 'director') {
      document.getElementById('seccion-director').hidden = false;
      const usuarios = readStorageArray(STORAGE_KEYS.usuarios);
      const historial = readStorageArray(STORAGE_KEYS.historialAccesos);
      setText('total-usuarios', usuarios.length);
      setText('total-accesos', historial.length);
      setText('clientes-activos', usuarios.filter(function(item) {
        return item.perfil === 'cliente';
      }).length);
      if (historial.length > 0) {
        setText('ultimo-acceso', historial[historial.length - 1].timestamp);
      }
    } else if (usuario.perfil === 'tecnico') {
      document.getElementById('seccion-tecnico').hidden = false;
      const historialTecnico = readStorageArray(STORAGE_KEYS.historialAccesos).filter(function(item) {
        return item.usuarioId === usuario.id;
      });
      setText('tareas-completadas', historialTecnico.length);
      setText('reportes-generados', Math.floor(historialTecnico.length / 2));
    } else if (usuario.perfil === 'cliente') {
      document.getElementById('seccion-cliente').hidden = false;
      setText('servicios-cliente', '3');
      setText('gasto-total', 'CLP $420.000');
    }

    const historial = readStorageArray(STORAGE_KEYS.historialAccesos);
    const cuerpoHistorial = document.getElementById('cuerpo-historial');
    if (cuerpoHistorial) {
      cuerpoHistorial.replaceChildren();
      if (historial.length === 0) {
        const filaVacia = document.createElement('tr');
        const celdaVacia = document.createElement('td');
        celdaVacia.colSpan = 4;
        celdaVacia.className = 'empty-state';
        celdaVacia.textContent = 'Sin historial de actividades';
        filaVacia.appendChild(celdaVacia);
        cuerpoHistorial.appendChild(filaVacia);
      } else {
        historial.slice().reverse().forEach(function(entrada) {
          const fila = document.createElement('tr');
          const accion = document.createElement('strong');
          accion.textContent = entrada.accion || '';
          const celdaAccion = document.createElement('td');
          celdaAccion.appendChild(accion);
          fila.appendChild(celdaAccion);
          [entrada.detalles, entrada.timestamp, entrada.url].forEach(function(valor) {
            const celda = document.createElement('td');
            celda.textContent = valor || '';
            fila.appendChild(celda);
          });
          cuerpoHistorial.appendChild(fila);
        });
      }
    }

    const resumenTecnico = safeGetById('resumen-tecnico');
    if (resumenTecnico) {
      resumenTecnico.replaceChildren();
      [
        ['Usuarios registrados', readStorageArray(STORAGE_KEYS.usuarios).length],
        ['Total de accesos', historial.length],
        ['Última actividad', historial.length > 0 ? historial[historial.length - 1].timestamp : 'N/A'],
        ['Perfil actual', usuario.perfil.toUpperCase()]
      ].forEach(function(item) {
        const linea = document.createElement('p');
        const etiqueta = document.createElement('strong');
        etiqueta.textContent = item[0] + ': ';
        linea.appendChild(etiqueta);
        linea.appendChild(document.createTextNode(String(item[1])));
        resumenTecnico.appendChild(linea);
      });
    }

    Auth.registerAccess('PANEL_ACCESO', 'Accedió al panel de control');
  }

  function initializeApp() {
    Auth.initUsers();

    if (isLoginPage()) {
      if (Auth.isLoggedIn()) {
        window.location.replace('index.html');
        return;
      }
      setupLoginPage();
      return;
    }

    if (!Auth.isLoggedIn()) {
      window.location.replace('login.html');
      return;
    }

    Auth.registerAccess('NAVEGACIÓN', 'Visitó ' + document.title);
    setupMenu();
    addPanelLinkAndLogout();
    renderTeam();
    setupBudget();
    setupMixCalculator();
    setupGoogleAdsCalculator();
    setupContactForm();
    setupAccordions();
    renderPanel();
  }

  document.addEventListener('DOMContentLoaded', initializeApp);

})();


