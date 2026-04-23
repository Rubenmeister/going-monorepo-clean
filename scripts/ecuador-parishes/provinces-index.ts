/**
 * Ecuador — Índice oficial de provincias, cantones y parroquias
 * Fuente: INEC / División Político-Administrativa del Ecuador
 * 24 provincias · 221 cantones · ~1,023 parroquias
 */
export interface ProvinceIndex {
  id: string;
  name: string;
  region: 'Costa' | 'Sierra' | 'Amazonía' | 'Galápagos';
  capital: string;
  cantons: CantonIndex[];
}

export interface CantonIndex {
  id: string;
  name: string;
  capital: string;
  parishes: string[];   // parroquia names
}

export const ECUADOR_INDEX: ProvinceIndex[] = [
  {
    id: 'azuay', name: 'Azuay', region: 'Sierra', capital: 'Cuenca',
    cantons: [
      { id: 'cuenca', name: 'Cuenca', capital: 'Cuenca', parishes: ['Cuenca','Baños','Chumblín','El Valle','Llacao','Molleturo','Nulti','Octavio Cordero Palacios','Paccha','Quingeo','San Joaquín','Santa Ana','Sayausí','Sinincay','Tarqui','Turi','Valle','Victoria del Portete'] },
      { id: 'giron', name: 'Girón', capital: 'Girón', parishes: ['Girón','Asunción','San Gerardo'] },
      { id: 'gualaceo', name: 'Gualaceo', capital: 'Gualaceo', parishes: ['Gualaceo','Daniel Córdova Toral','Jadán','Ludo','Mariano Moreno','Remigio Crespo Toral','San Juan','Santa Catalina','Simón Bolívar','Luis Cordero Vega'] },
      { id: 'nabon', name: 'Nabón', capital: 'Nabón', parishes: ['Nabón','Cochapata','Las Nieves','El Progreso'] },
      { id: 'paute', name: 'Paute', capital: 'Paute', parishes: ['Paute','Bulán','Chicán','El Cabo','Guarainag','Tomebamba','Dug Dug','San Cristóbal'] },
      { id: 'pucara', name: 'Pucará', capital: 'Pucará', parishes: ['Pucará','San Rafael de Sharug','El Carmen de Pijilí'] },
      { id: 'san_fernando', name: 'San Fernando', capital: 'San Fernando', parishes: ['San Fernando','Chumblín'] },
      { id: 'santa_isabel', name: 'Santa Isabel', capital: 'Santa Isabel', parishes: ['Santa Isabel','Abdón Calderón','El Carmen de Pijilí','Zhaglli','Shaglli','San Salvador'] },
      { id: 'sigsig', name: 'Sígsig', capital: 'Sígsig', parishes: ['Sígsig','Cuchil','Gima','Jima','Ludo','San Bartolomé','San José de Raranga'] },
      { id: 'oña', name: 'Oña', capital: 'Oña', parishes: ['Oña','Susudel'] },
      { id: 'chordeleg', name: 'Chordeleg', capital: 'Chordeleg', parishes: ['Chordeleg','Principal','Luis Galarza Orellana','San Martín de Puzhío'] },
      { id: 'el_pan', name: 'El Pan', capital: 'El Pan', parishes: ['El Pan','San Vicente'] },
      { id: 'sevilla_de_oro', name: 'Sevilla de Oro', capital: 'Sevilla de Oro', parishes: ['Sevilla de Oro','Amaluza','Palmas'] },
      { id: 'guachapala', name: 'Guachapala', capital: 'Guachapala', parishes: ['Guachapala'] },
      { id: 'camilo_ponce_enriquez', name: 'Camilo Ponce Enríquez', capital: 'Camilo Ponce Enríquez', parishes: ['Camilo Ponce Enríquez','Carmen de Pijilí','San Rafael de Sharug'] },
    ]
  },
  {
    id: 'bolivar', name: 'Bolívar', region: 'Sierra', capital: 'Guaranda',
    cantons: [
      { id: 'guaranda', name: 'Guaranda', capital: 'Guaranda', parishes: ['Guaranda','Guanujo','Julio Moreno','Lucio Paredes','Salinas','San Lorenzo','San Simón','Simiátug','Santa Fé','Facundo Vela'] },
      { id: 'caluma', name: 'Caluma', capital: 'Caluma', parishes: ['Caluma'] },
      { id: 'echeandia', name: 'Echeandía', capital: 'Echeandía', parishes: ['Echeandía'] },
      { id: 'chimbo', name: 'Chimbo', capital: 'San José de Chimbo', parishes: ['San José de Chimbo','Asunción','Magdalena','San Sebastián','Telimbela'] },
      { id: 'chillanes', name: 'Chillanes', capital: 'Chillanes', parishes: ['Chillanes','San José del Tambo'] },
      { id: 'las_naves', name: 'Las Naves', capital: 'Las Naves', parishes: ['Las Naves'] },
      { id: 'san_miguel', name: 'San Miguel', capital: 'San Miguel', parishes: ['San Miguel','Balsapamba','Bilován','Nono','San Pablo','San Vicente','Santiago','Telimbela'] },
    ]
  },
  {
    id: 'canar', name: 'Cañar', region: 'Sierra', capital: 'Azogues',
    cantons: [
      { id: 'azogues', name: 'Azogues', capital: 'Azogues', parishes: ['Azogues','Bayas','Cojitambo','Guapán','Javier Loyola','Luis Cordero','Pindilig','Rivera','San Miguel','Taday'] },
      { id: 'biblian', name: 'Biblián', capital: 'Biblián', parishes: ['Biblián','Jerusalén','Nazón','San Francisco de Sageo','Turupamba'] },
      { id: 'canar', name: 'Cañar', capital: 'Cañar', parishes: ['Cañar','Chorocopte','Ducur','General Morales','Gualleturo','Honorato Vásquez','Ingapirca','Juncal','San Antonio','Ventura','Zhud','Socarte'] },
      { id: 'la_troncal', name: 'La Troncal', capital: 'La Troncal', parishes: ['La Troncal','Manuel J. Calle','Pancho Negro'] },
      { id: 'el_tambo', name: 'El Tambo', capital: 'El Tambo', parishes: ['El Tambo'] },
      { id: 'deleg', name: 'Déleg', capital: 'Déleg', parishes: ['Déleg','Solano'] },
      { id: 'suscal', name: 'Suscal', capital: 'Suscal', parishes: ['Suscal'] },
    ]
  },
  {
    id: 'carchi', name: 'Carchi', region: 'Sierra', capital: 'Tulcán',
    cantons: [
      { id: 'tulcan', name: 'Tulcán', capital: 'Tulcán', parishes: ['Tulcán','El Carmelo','Julio Andrade','Maldonado','Pioter','Santa Martha de Cuba','Tobar Donoso','Tufiño','Urbina','El Chical'] },
      { id: 'bolivar_carchi', name: 'Bolívar', capital: 'Bolívar', parishes: ['Bolívar','Los Andes','Monte Olivo','San Rafael','San Vicente de Pusir'] },
      { id: 'espejo', name: 'Espejo', capital: 'El Ángel', parishes: ['El Ángel','27 de Septiembre','El Goaltal','La Libertad','San Isidro'] },
      { id: 'mira', name: 'Mira', capital: 'Mira', parishes: ['Mira','Concepción','Jijón y Caamaño','Juan Montalvo'] },
      { id: 'montufar', name: 'Montúfar', capital: 'San Gabriel', parishes: ['San Gabriel','Chitan de Navarrete','Cristóbal Colón','Fernández Salvador','La Paz','Piartal','Gonzáles Suárez'] },
      { id: 'san_pedro_huaca', name: 'San Pedro de Huaca', capital: 'Huaca', parishes: ['Huaca','Mariscal Sucre'] },
    ]
  },
  {
    id: 'chimborazo', name: 'Chimborazo', region: 'Sierra', capital: 'Riobamba',
    cantons: [
      { id: 'riobamba', name: 'Riobamba', capital: 'Riobamba', parishes: ['Riobamba','Cacha','Calpi','Cubijíes','Flores','Licán','Licto','Pungalá','Punín','Quimiag','San Juan','San Luis','Yaruquíes'] },
      { id: 'alausi', name: 'Alausí', capital: 'Alausí', parishes: ['Alausí','Achupallas','Guasuntos','Huigra','Multitud','Pumallacta','Sevilla','Sibambe','Tixán'] },
      { id: 'colta', name: 'Colta', capital: 'Villa La Unión', parishes: ['Villa La Unión','Cajabamba','Cañi','Columbe','Juan de Velasco','Santiago de Quito'] },
      { id: 'chambo', name: 'Chambo', capital: 'Chambo', parishes: ['Chambo'] },
      { id: 'chunchi', name: 'Chunchi', capital: 'Chunchi', parishes: ['Chunchi','Capsol','Compud','Gonzol','Llagos'] },
      { id: 'guamote', name: 'Guamote', capital: 'Guamote', parishes: ['Guamote','Cebadas','Palmira'] },
      { id: 'guano', name: 'Guano', capital: 'Guano', parishes: ['Guano','El Rosario','La Providencia','San Andrés','San Gerardo','San Isidro de Pataló','Santa Fe de Galán','Ilapo','San José de Chazo','Valparaíso'] },
      { id: 'pallatanga', name: 'Pallatanga', capital: 'Pallatanga', parishes: ['Pallatanga'] },
      { id: 'penipe', name: 'Penipe', capital: 'Penipe', parishes: ['Penipe','El Altar','La Candelaria','Matus','Puela','San Antonio de Bayushig','Bayushig'] },
      { id: 'cumanda', name: 'Cumandá', capital: 'Cumandá', parishes: ['Cumandá'] },
    ]
  },
  {
    id: 'cotopaxi', name: 'Cotopaxi', region: 'Sierra', capital: 'Latacunga',
    cantons: [
      { id: 'latacunga', name: 'Latacunga', capital: 'Latacunga', parishes: ['Latacunga','Aláquez','Belisario Quevedo','Guaytacama','Joseguango Bajo','Mulaló','11 de Noviembre','Pastocalle','Poaló','San Juan de Pastocalle','Tanicuchí','Toacaso'] },
      { id: 'la_mana', name: 'La Maná', capital: 'La Maná', parishes: ['La Maná','El Triunfo','Guasaganda','Pucayacu'] },
      { id: 'pangua', name: 'Pangua', capital: 'El Corazón', parishes: ['El Corazón','Moraspungo','Pinllopata','Ramón Campaña'] },
      { id: 'pujili', name: 'Pujilí', capital: 'Pujilí', parishes: ['Pujilí','Angamarca','Guangaje','La Victoria','Pilaló','Tingo','Zumbahua'] },
      { id: 'salcedo', name: 'Salcedo', capital: 'Salcedo', parishes: ['Salcedo','Antonio José Holguín','Cusubamba','Mulalillo','Mulliquindil','Panzaleo'] },
      { id: 'saquisili', name: 'Saquisilí', capital: 'Saquisilí', parishes: ['Saquisilí','Canchagua','Chantilín','Cochapamba'] },
      { id: 'sigchos', name: 'Sigchos', capital: 'Sigchos', parishes: ['Sigchos','Chugchilán','Isinliví','Las Pampas','Palo Quemado'] },
    ]
  },
  {
    id: 'el_oro', name: 'El Oro', region: 'Costa', capital: 'Machala',
    cantons: [
      { id: 'machala', name: 'Machala', capital: 'Machala', parishes: ['Machala','El Cambio','El Retiro','La Providencia','Jubones','Puerto Bolívar'] },
      { id: 'arenillas', name: 'Arenillas', capital: 'Arenillas', parishes: ['Arenillas','Carcabón','Palmales','Chacras'] },
      { id: 'atahualpa', name: 'Atahualpa', capital: 'Paccha', parishes: ['Paccha','Ayapamba','Cordoncillo','Milagros','San José','Uzhcurrumi'] },
      { id: 'balsas', name: 'Balsas', capital: 'Balsas', parishes: ['Balsas','Bellamaria'] },
      { id: 'chilla', name: 'Chilla', capital: 'Chilla', parishes: ['Chilla'] },
      { id: 'el_guabo', name: 'El Guabo', capital: 'El Guabo', parishes: ['El Guabo','Barbones','La Iberia','Tendales','Río Bonito'] },
      { id: 'huaquillas', name: 'Huaquillas', capital: 'Huaquillas', parishes: ['Huaquillas','El Paraíso','Hualtaco','Milton Reyes','Ecuador'] },
      { id: 'marcabeli', name: 'Marcabelí', capital: 'Marcabelí', parishes: ['Marcabelí','El Ingenio'] },
      { id: 'pasaje', name: 'Pasaje', capital: 'Pasaje', parishes: ['Pasaje','Bolívar','Buenavista','Cañaquemada','El Progreso','La Peaña','Lomas de Sargentillo','Ochoa León','Tres Cerritos'] },
      { id: 'pinas', name: 'Piñas', capital: 'Piñas', parishes: ['Piñas','Capiro','La Bocana','Moromoro','San Roque','Saracay'] },
      { id: 'portovelo', name: 'Portovelo', capital: 'Portovelo', parishes: ['Portovelo','Curtincápac','Morales','Salati'] },
      { id: 'santa_rosa', name: 'Santa Rosa', capital: 'Santa Rosa', parishes: ['Santa Rosa','Bellavista','La Avanzada','Torata','Victoria','San Antonio'] },
      { id: 'zaruma', name: 'Zaruma', capital: 'Zaruma', parishes: ['Zaruma','Abañín','Arcapamba','Guanazán','Guizhaguiña','Huertas','Malvas','Muluncay','Sinsao','Salvias'] },
      { id: 'las_lajas', name: 'Las Lajas', capital: 'Las Lajas', parishes: ['Las Lajas'] },
    ]
  },
  {
    id: 'esmeraldas', name: 'Esmeraldas', region: 'Costa', capital: 'Esmeraldas',
    cantons: [
      { id: 'esmeraldas', name: 'Esmeraldas', capital: 'Esmeraldas', parishes: ['Esmeraldas','Chinca','Crnel. Carlos Concha Torres','Las Palmas','Simón Plata Torres','Tachina','Tabiazo','Vuelta Larga'] },
      { id: 'atacames', name: 'Atacames', capital: 'Atacames', parishes: ['Atacames','La Unión','Sua','Tonchigüe','Tonsupa'] },
      { id: 'eloy_alfaro', name: 'Eloy Alfaro', capital: 'Valdez (Limones)', parishes: ['Valdez','Anchayacu','Atahualpa','Borbón','La Tola','Luis Vargas Torres','Malimpia','Pampanal de Bolívar','San Francisco de Onzole','Selva Alegre','Telembí','Santo Domingo de Onzole','Timbiré'] },
      { id: 'muisne', name: 'Muisne', capital: 'Muisne', parishes: ['Muisne','Bolívar','Daule','Galera','Quingue','San Francisco','San Gregorio','San José de Chamanga'] },
      { id: 'quininde', name: 'Quinindé', capital: 'Rosa Zárate', parishes: ['Rosa Zárate','La Unión','Malimpia','Viche','Cube'] },
      { id: 'san_lorenzo', name: 'San Lorenzo', capital: 'San Lorenzo', parishes: ['San Lorenzo','Alto Tambo','Ancón de Sardinas','Santa Rita','Tambillo','Tululbí','Urbina'] },
      { id: 'rioverde', name: 'Rioverde', capital: 'Rioverde', parishes: ['Rioverde','Chontaduro','Chumundé','Lagarto','Montalvo'] },
      { id: 'la_concordia', name: 'La Concordia', capital: 'La Concordia', parishes: ['La Concordia','La Villegas','El Paraíso de Chontaduro'] },
    ]
  },
  {
    id: 'galapagos', name: 'Galápagos', region: 'Galápagos', capital: 'Puerto Baquerizo Moreno',
    cantons: [
      { id: 'san_cristobal', name: 'San Cristóbal', capital: 'Puerto Baquerizo Moreno', parishes: ['Puerto Baquerizo Moreno','El Progreso'] },
      { id: 'isabela', name: 'Isabela', capital: 'Puerto Villamil', parishes: ['Puerto Villamil'] },
      { id: 'santa_cruz', name: 'Santa Cruz', capital: 'Puerto Ayora', parishes: ['Puerto Ayora','Santa Rosa','Bellavista'] },
    ]
  },
  {
    id: 'guayas', name: 'Guayas', region: 'Costa', capital: 'Guayaquil',
    cantons: [
      { id: 'guayaquil', name: 'Guayaquil', capital: 'Guayaquil', parishes: ['Guayaquil','Chongón','Juan Gómez Rendón','Morro','Nobol','Playas','Posorja','Progreso','Puná','Tarifa','Tenguel'] },
      { id: 'alfredo_baquerizo_moreno', name: 'Alfredo Baquerizo Moreno', capital: 'Juján', parishes: ['Juján'] },
      { id: 'balao', name: 'Balao', capital: 'Balao', parishes: ['Balao'] },
      { id: 'balzar', name: 'Balzar', capital: 'Balzar', parishes: ['Balzar'] },
      { id: 'colimes', name: 'Colimes', capital: 'Colimes', parishes: ['Colimes','Palestina'] },
      { id: 'coronel_marcelino_mariduena', name: 'Coronel Marcelino Maridueña', capital: 'San Carlos', parishes: ['San Carlos'] },
      { id: 'daule', name: 'Daule', capital: 'Daule', parishes: ['Daule','El Rosario','La Aurora','Laurel','Limonal','Los Lojas'] },
      { id: 'duran', name: 'Durán', capital: 'Durán', parishes: ['Eloy Alfaro (Durán)'] },
      { id: 'el_empalme', name: 'El Empalme', capital: 'El Empalme', parishes: ['El Empalme','El Rosario','Guayas'] },
      { id: 'el_triunfo', name: 'El Triunfo', capital: 'El Triunfo', parishes: ['El Triunfo'] },
      { id: 'general_antonio_elizalde', name: 'General Antonio Elizalde', capital: 'Bucay', parishes: ['Bucay'] },
      { id: 'isidro_ayora', name: 'Isidro Ayora', capital: 'Isidro Ayora', parishes: ['Isidro Ayora'] },
      { id: 'lomas_de_sargentillo', name: 'Lomas de Sargentillo', capital: 'Lomas de Sargentillo', parishes: ['Lomas de Sargentillo'] },
      { id: 'milagro', name: 'Milagro', capital: 'Milagro', parishes: ['Milagro','Chobo','Mariscal Sucre','Roberto Astudillo'] },
      { id: 'naranjal', name: 'Naranjal', capital: 'Naranjal', parishes: ['Naranjal','Jesús María','Santa Rosa de Flandes','San Carlos'] },
      { id: 'naranjito', name: 'Naranjito', capital: 'Naranjito', parishes: ['Naranjito'] },
      { id: 'palestina', name: 'Palestina', capital: 'Palestina', parishes: ['Palestina'] },
      { id: 'pedro_carbo', name: 'Pedro Carbo', capital: 'Pedro Carbo', parishes: ['Pedro Carbo','Bajada de Chanduy','Colonche','Chanduy','Engabao','General Villamil (Playas)','Río Verde','Zapotal'] },
      { id: 'samborondon', name: 'Samborondón', capital: 'Samborondón', parishes: ['Samborondón','La Puntilla','Tarifa'] },
      { id: 'santa_lucia', name: 'Santa Lucía', capital: 'Santa Lucía', parishes: ['Santa Lucía'] },
      { id: 'simon_bolivar', name: 'Simón Bolívar', capital: 'Simón Bolívar', parishes: ['Simón Bolívar','Lorenzo de Garaicoa'] },
      { id: 'yaguachi', name: 'Yaguachi', capital: 'San Jacinto de Yaguachi', parishes: ['San Jacinto de Yaguachi','Gral. Pedro J. Montero','Virgen de Fátima','Yaguachi Viejo'] },
      { id: 'playas', name: 'Playas', capital: 'General Villamil', parishes: ['General Villamil','Data de Villamil','El Morro','Engabao','Posorja'] },
      { id: 'san_jacinto_de_yaguachi', name: 'San Jacinto de Yaguachi', capital: 'Yaguachi', parishes: ['Yaguachi'] },
      { id: 'nobol', name: 'Nobol', capital: 'Narcisa de Jesús', parishes: ['Narcisa de Jesús'] },
      { id: 'santa_elena_guayas', name: 'Santa Elena', capital: 'Santa Elena', parishes: ['Santa Elena','Atahualpa','Ballenita','Chanduy','Colonche','Manglaralto','Simón Bolívar','San José de Ancón'] },
    ]
  },
  {
    id: 'imbabura', name: 'Imbabura', region: 'Sierra', capital: 'Ibarra',
    cantons: [
      { id: 'ibarra', name: 'Ibarra', capital: 'Ibarra', parishes: ['Ibarra','Ambuquí','Angochagua','Carolina','La Esperanza','Lita','Salinas','San Antonio'] },
      { id: 'antonio_ante', name: 'Antonio Ante', capital: 'Atuntaqui', parishes: ['Atuntaqui','Andrade Marín','Imbaya','San Francisco de Natabuela','San José de Chaltura','San Roque'] },
      { id: 'cotacachi', name: 'Cotacachi', capital: 'Cotacachi', parishes: ['Cotacachi','Apuela','García Moreno','Imantag','Peñaherrera','Plaza Gutiérrez','Quiroga','6 de Julio de Cuellaje','Vacas Galindo'] },
      { id: 'otavalo', name: 'Otavalo', capital: 'Otavalo', parishes: ['Otavalo','Dr. Miguel Egas Cabezas','Eugenio Espejo','González Suárez','Pataquí','San José de Quichinche','San Juan de Ilumán','San Pablo','San Rafael','Selva Alegre'] },
      { id: 'pimampiro', name: 'Pimampiro', capital: 'Pimampiro', parishes: ['Pimampiro','Chugá','Mariano Acosta','San Francisco de Sigsipamba'] },
      { id: 'san_miguel_de_urcuqui', name: 'San Miguel de Urcuquí', capital: 'Urcuquí', parishes: ['Urcuquí','Cahuasquí','La Merced de Buenos Aires','Pablo Arenas','San Blas','Tumbabiro'] },
    ]
  },
  {
    id: 'loja', name: 'Loja', region: 'Sierra', capital: 'Loja',
    cantons: [
      { id: 'loja', name: 'Loja', capital: 'Loja', parishes: ['Loja','Chantaco','Chuquiribamba','El Cisne','Gualel','Jimbilla','Malacatos','San Lucas','San Pedro de Vilcabamba','Santiago','Taquil','Yangana','Vilcabamba','Quinara','Urdaneta'] },
      { id: 'calvas', name: 'Calvas', capital: 'Cariamanga', parishes: ['Cariamanga','Colaisaca','El Lucero','Utuana','Sanguilín'] },
      { id: 'catamayo', name: 'Catamayo', capital: 'Catamayo', parishes: ['Catamayo','El Tambo','Guayquichuma','San Pedro de la Bendita','Zambi'] },
      { id: 'celica', name: 'Celica', capital: 'Celica', parishes: ['Celica','Cruzpamba','Pozul','Sabanilla','Tnte. Maximiliano Rodríguez Loaiza'] },
      { id: 'chaguarpamba', name: 'Chaguarpamba', capital: 'Chaguarpamba', parishes: ['Chaguarpamba','Buenavista','El Rosario','Santa Rufina','Yamana'] },
      { id: 'espindola', name: 'Espíndola', capital: 'Amaluza', parishes: ['Amaluza','Bellavista','El Airo','Jimbura','Santa Teresita','27 de Abril','El Ingenio'] },
      { id: 'gonzanama', name: 'Gonzanamá', capital: 'Gonzanamá', parishes: ['Gonzanamá','Changaimina','Nambacola','Purunuma','Quilanga'] },
      { id: 'macara', name: 'Macará', capital: 'Macará', parishes: ['Macará','Larama','La Victoria','Sabiango'] },
      { id: 'paltas', name: 'Paltas', capital: 'Catacocha', parishes: ['Catacocha','Cangonamá','Guachanamá','La Tingue','Lauro Guerrero','Orianga','San Antonio','Yamana'] },
      { id: 'pindal', name: 'Pindal', capital: 'Pindal', parishes: ['Pindal','Chaquinal','12 de Diciembre','Milagros'] },
      { id: 'puyango', name: 'Puyango', capital: 'Alamor', parishes: ['Alamor','Ciano','El Arenal','El Limo','Mercadillo','Vicentino'] },
      { id: 'quilanga', name: 'Quilanga', capital: 'Quilanga', parishes: ['Quilanga','Fundochamba','San Antonio de las Aradas'] },
      { id: 'saraguro', name: 'Saraguro', capital: 'Saraguro', parishes: ['Saraguro','El Paraíso de Celén','El Tablón','Lluzhapa','Manu','San Antonio de Qumbe','San Pablo de Tenta','San Sebastián de Yúluc','Selva Alegre','Sumaypamba','Urdaneta'] },
      { id: 'sozoranga', name: 'Sozoranga', capital: 'Sozoranga', parishes: ['Sozoranga','Nueva Fátima','Tacamoros'] },
      { id: 'zapotillo', name: 'Zapotillo', capital: 'Zapotillo', parishes: ['Zapotillo','Cazaderos','Garzareal','Limones','Mangahurco','Paletillas','Bolaspamba'] },
      { id: 'olmedo_loja', name: 'Olmedo', capital: 'Olmedo', parishes: ['Olmedo'] },
    ]
  },
  {
    id: 'los_rios', name: 'Los Ríos', region: 'Costa', capital: 'Babahoyo',
    cantons: [
      { id: 'babahoyo', name: 'Babahoyo', capital: 'Babahoyo', parishes: ['Babahoyo','Caracol','Clemente Baquerizo','Febres Cordero','Pimocha','La Unión'] },
      { id: 'baba', name: 'Baba', capital: 'Baba', parishes: ['Baba','Guare','Isla de Bejucal'] },
      { id: 'buena_fe', name: 'Buena Fe', capital: 'Buena Fe', parishes: ['Buena Fe','La Unión','Patricia Pilar'] },
      { id: 'mocache', name: 'Mocache', capital: 'Mocache', parishes: ['Mocache','La Esperanza'] },
      { id: 'montalvo', name: 'Montalvo', capital: 'Montalvo', parishes: ['Montalvo'] },
      { id: 'puebloviejo', name: 'Puebloviejo', capital: 'Puebloviejo', parishes: ['Puebloviejo','Puerto Pechiche','San Juan'] },
      { id: 'quevedo', name: 'Quevedo', capital: 'Quevedo', parishes: ['Quevedo','San Cristóbal','Nicolás Infante Díaz','Venus del Río Quevedo','24 de Mayo'] },
      { id: 'urdaneta', name: 'Urdaneta', capital: 'Catarama', parishes: ['Catarama','Ricaurte'] },
      { id: 'ventanas', name: 'Ventanas', capital: 'Ventanas', parishes: ['Ventanas','Zapotal','Los Ángeles','Chacarita'] },
      { id: 'vinces', name: 'Vinces', capital: 'Vinces', parishes: ['Vinces','Ayampe','Antonio Sotomayor'] },
      { id: 'palenque', name: 'Palenque', capital: 'Palenque', parishes: ['Palenque'] },
      { id: 'quinsaloma', name: 'Quinsaloma', capital: 'Quinsaloma', parishes: ['Quinsaloma'] },
      { id: 'valencia', name: 'Valencia', capital: 'Valencia', parishes: ['Valencia'] },
    ]
  },
  {
    id: 'manabi', name: 'Manabí', region: 'Costa', capital: 'Portoviejo',
    cantons: [
      { id: 'portoviejo', name: 'Portoviejo', capital: 'Portoviejo', parishes: ['Portoviejo','Abdon Calderón','Andrés de Vera','Colón','La Unión','Pueblo Nuevo','Riochico','San Plácido','Crucita'] },
      { id: 'bolivar_manabi', name: 'Bolívar', capital: 'Calceta', parishes: ['Calceta','Quiroga','Membrillo','Sancan'] },
      { id: 'chone', name: 'Chone', capital: 'Chone', parishes: ['Chone','Boyacá','Canuto','Convento','Eloy Alfaro','Hilario Álava Leyva','Ricaurte','San Antonio'] },
      { id: 'el_carmen', name: 'El Carmen', capital: 'El Carmen', parishes: ['El Carmen','Wilfrido Loor Moreira','Tablada de Tambo'] },
      { id: 'flavio_alfaro', name: 'Flavio Alfaro', capital: 'Flavio Alfaro', parishes: ['Flavio Alfaro','Zapallo'] },
      { id: 'jipijapa', name: 'Jipijapa', capital: 'Jipijapa', parishes: ['Jipijapa','América','El Anegado','La Unión','Julcuy','Membrillo','Pedro Pablo Gómez','Puerto Cayo'] },
      { id: 'junin', name: 'Junín', capital: 'Junín', parishes: ['Junín','Ricaurte'] },
      { id: 'manta', name: 'Manta', capital: 'Manta', parishes: ['Manta','Los Esteros','San Mateo','Santa Marianita de Jesús','Ligüiqui'] },
      { id: 'montecristi', name: 'Montecristi', capital: 'Montecristi', parishes: ['Montecristi','Calicuchima','Chirijos','La Pila'] },
      { id: 'pajan', name: 'Paján', capital: 'Paján', parishes: ['Paján','Campozano','Cascol','Guale','Lascano'] },
      { id: 'pichincha_manabi', name: 'Pichincha', capital: 'Pichincha', parishes: ['Pichincha','Barraganete','El Horario','San Sebastián'] },
      { id: 'rocafuerte', name: 'Rocafuerte', capital: 'Rocafuerte', parishes: ['Rocafuerte'] },
      { id: 'santa_ana', name: 'Santa Ana', capital: 'Santa Ana', parishes: ['Santa Ana','Ayacucho','Honorato Vásquez','La Unión','Los Ángeles','Luchoa','San Pablo'] },
      { id: 'sucre', name: 'Sucre', capital: 'Bahía de Caráquez', parishes: ['Bahía de Caráquez','Charapotó','Leonidas Plaza','San Isidro','Bravo'] },
      { id: 'tosagua', name: 'Tosagua', capital: 'Tosagua', parishes: ['Tosagua','Angel Pedro Giler','Bachillero'] },
      { id: '24_de_mayo', name: '24 de Mayo', capital: 'Sucre', parishes: ['Sucre','Bellavista','Noboa','Olmedo','Pedro Pablo Gómez'] },
      { id: 'pedernales', name: 'Pedernales', capital: 'Pedernales', parishes: ['Pedernales','Cojimíes','10 de Agosto','26 de Septiembre','Atahualpa'] },
      { id: 'olmedo_manabi', name: 'Olmedo', capital: 'Olmedo', parishes: ['Olmedo','El Paraíso'] },
      { id: 'puerto_lopez', name: 'Puerto López', capital: 'Puerto López', parishes: ['Puerto López','Machalilla','Salango'] },
      { id: 'jama', name: 'Jama', capital: 'Jama', parishes: ['Jama','Cabo San Francisco','Don Juan','La Estancilla','Pedernales','San Lorenzo'] },
      { id: 'jaramijo', name: 'Jaramijó', capital: 'Jaramijó', parishes: ['Jaramijó'] },
      { id: 'san_vicente', name: 'San Vicente', capital: 'San Vicente', parishes: ['San Vicente','Canoa'] },
    ]
  },
  {
    id: 'morona_santiago', name: 'Morona Santiago', region: 'Amazonía', capital: 'Macas',
    cantons: [
      { id: 'morona', name: 'Morona', capital: 'Macas', parishes: ['Macas','Alshi','General Proaño','San Isidro','San Francisco','Sinaí','Sevilla Don Bosco','Zuña'] },
      { id: 'gualaquiza', name: 'Gualaquiza', capital: 'Gualaquiza', parishes: ['Gualaquiza','Bermejos','Bomboiza','Chiguinda','El Ideal','Nueva Tarqui','San Miguel de Cuyes'] },
      { id: 'huamboya', name: 'Huamboya', capital: 'Huamboya', parishes: ['Huamboya','Chiguaza'] },
      { id: 'limon_indanza', name: 'Limón Indanza', capital: 'General Leonidas Plaza Gutiérrez', parishes: ['General Leonidas Plaza Gutiérrez','Indanza','San Miguel de Conchay','Santa Susana de Chiviaza','Yunganza'] },
      { id: 'logroño', name: 'Logroño', capital: 'Logroño', parishes: ['Logroño','Shimpis','Yaupi'] },
      { id: 'palora', name: 'Palora', capital: 'Palora', parishes: ['Palora','Arapicos','Cumandá','Sangay','16 de Agosto'] },
      { id: 'santiago', name: 'Santiago', capital: 'Méndez', parishes: ['Méndez','Copal','Chupianza','Patuca','San Francisco de Chinimbimi','San Luis del Acho','Santiago de Pananza','Tayuza'] },
      { id: 'sucua', name: 'Sucúa', capital: 'Sucúa', parishes: ['Sucúa','Asunción','Huambi','Santa Marianita de Jesús'] },
      { id: 'tiwintza', name: 'Tiwintza', capital: 'San José de Morona', parishes: ['San José de Morona','Santiago'] },
      { id: 'san_juan_bosco', name: 'San Juan Bosco', capital: 'San Juan Bosco', parishes: ['San Juan Bosco','Pan de Azúcar','San Carlos de Limón','San Jacinto de Wakambeis','Santiago de Pananza'] },
    ]
  },
  {
    id: 'napo', name: 'Napo', region: 'Amazonía', capital: 'Tena',
    cantons: [
      { id: 'tena', name: 'Tena', capital: 'Tena', parishes: ['Tena','Ahuano','Chontapunta','Muyuna','Puerto Misahuallí','Puerto Napo','Talag'] },
      { id: 'archidona', name: 'Archidona', capital: 'Archidona', parishes: ['Archidona','Cotundo','San Pablo de Ushpayacu'] },
      { id: 'el_chaco', name: 'El Chaco', capital: 'El Chaco', parishes: ['El Chaco','Gonzalo Díaz de Pineda','Linares','Oyacachi','Santa Rosa','Sardinas'] },
      { id: 'quijos', name: 'Quijos', capital: 'Baeza', parishes: ['Baeza','Borja','Cosanga','Cuyuja','Papallacta','San Francisco de Borja','Sumaco'] },
      { id: 'carlos_julio_arosemena', name: 'Carlos Julio Arosemena Tola', capital: 'Carlos Julio Arosemena Tola', parishes: ['Carlos Julio Arosemena Tola'] },
    ]
  },
  {
    id: 'orellana', name: 'Orellana', region: 'Amazonía', capital: 'Puerto Francisco de Orellana',
    cantons: [
      { id: 'francisco_de_orellana', name: 'Francisco de Orellana', capital: 'Puerto Francisco de Orellana (Coca)', parishes: ['Puerto Francisco de Orellana','Alejandro Labaka','El Dorado','El Edén','García Moreno','Gutiérrez Garbay','Inés Arango','La Belleza','Nuevo Paraíso','San José de Guayusa','San Luis de Armenia'] },
      { id: 'aguarico', name: 'Aguarico', capital: 'Nuevo Rocafuerte', parishes: ['Nuevo Rocafuerte','Capitán Augusto Rivadeneyra','Cononaco','Tiputini','Yasuní'] },
      { id: 'la_joya_de_los_sachas', name: 'La Joya de los Sachas', capital: 'La Joya de los Sachas', parishes: ['La Joya de los Sachas','Enokanqui','Pompeya','San Carlos','San Sebastián del Coca','Lago San Pedro','Unión Milagreña','Tres de Noviembre','Dayuma'] },
      { id: 'loreto', name: 'Loreto', capital: 'Loreto', parishes: ['Loreto','Ávila Huiruno','Puerto Murialdo','San José de Dahuano','San José de Payamino','San Vicente de Huaticocha'] },
    ]
  },
  {
    id: 'pastaza', name: 'Pastaza', region: 'Amazonía', capital: 'Puyo',
    cantons: [
      { id: 'pastaza', name: 'Pastaza', capital: 'Puyo', parishes: ['Puyo','Canelos','Diez de Agosto','El Triunfo','Fátima','Montalvo','Pomona','Río Corrientes','Río Tigre','Sarayacu','Simón Bolívar','Tarqui','Teniente Hugo Ortiz','Veracruz','Madre Tierra'] },
      { id: 'arajuno', name: 'Arajuno', capital: 'Arajuno', parishes: ['Arajuno','Curaray'] },
      { id: 'mera', name: 'Mera', capital: 'Mera', parishes: ['Mera','Madre Tierra','Shell'] },
      { id: 'santa_clara', name: 'Santa Clara', capital: 'Santa Clara', parishes: ['Santa Clara','San José'] },
    ]
  },
  {
    id: 'pichincha', name: 'Pichincha', region: 'Sierra', capital: 'Quito',
    cantons: [
      { id: 'quito', name: 'Quito', capital: 'Quito', parishes: ['Quito','Alangasí','Amaguaña','Atahualpa','Calacalí','Calderón','Chavezpamba','Checa','El Quinche','Gualea','Guangopolo','Guayllabamba','La Merced','Llano Chico','Lloa','Nanegal','Nanegalito','Nayón','Nono','Pacto','Perucho','Pifo','Píntag','Pomasqui','Puéllaro','Puembo','San Antonio de Pichincha','San José de Minas','Tababela','Tumbaco','Yaruquí','Zámbiza'] },
      { id: 'cayambe', name: 'Cayambe', capital: 'Cayambe', parishes: ['Cayambe','Ascázubi','Cangahua','Olmedo','Otón','Juan Montalvo','Santa Rosa de Cuzubamba'] },
      { id: 'mejia', name: 'Mejía', capital: 'Machachi', parishes: ['Machachi','Alóag','Aloasí','Cutuglahua','El Chaupi','Manuel Cornejo Astorga','Tambillo','Uyumbicho'] },
      { id: 'pedro_moncayo', name: 'Pedro Moncayo', capital: 'Tabacundo', parishes: ['Tabacundo','La Esperanza','Malchinguí','Tocachi','Tupigachi'] },
      { id: 'pedro_vicente_maldonado', name: 'Pedro Vicente Maldonado', capital: 'Pedro Vicente Maldonado', parishes: ['Pedro Vicente Maldonado','El Paraíso de Celén'] },
      { id: 'puerto_quito', name: 'Puerto Quito', capital: 'Puerto Quito', parishes: ['Puerto Quito'] },
      { id: 'rumiñahui', name: 'Rumiñahui', capital: 'Sangolquí', parishes: ['Sangolquí','Cotogchoa','Rumipamba'] },
      { id: 'san_miguel_de_los_bancos', name: 'San Miguel de los Bancos', capital: 'San Miguel de los Bancos', parishes: ['San Miguel de los Bancos','Mindo','Pacto'] },
    ]
  },
  {
    id: 'santa_elena', name: 'Santa Elena', region: 'Costa', capital: 'Santa Elena',
    cantons: [
      { id: 'santa_elena', name: 'Santa Elena', capital: 'Santa Elena', parishes: ['Santa Elena','Atahualpa','Ballenita','Chanduy','Colonche','Manglaralto','Simón Bolívar','San José de Ancón'] },
      { id: 'la_libertad', name: 'La Libertad', capital: 'La Libertad', parishes: ['La Libertad'] },
      { id: 'salinas', name: 'Salinas', capital: 'Salinas', parishes: ['Salinas','Carlos Espinoza Larrea','Anconcito','José Luis Tamayo'] },
    ]
  },
  {
    id: 'santo_domingo', name: 'Santo Domingo de los Tsáchilas', region: 'Costa', capital: 'Santo Domingo',
    cantons: [
      { id: 'santo_domingo', name: 'Santo Domingo', capital: 'Santo Domingo', parishes: ['Santo Domingo','Alluriquín','El Esfuerzo','Luz de América','Puerto Limón','San Jacinto del Búa','Santa María del Toachi','Valle Hermoso'] },
      { id: 'la_concordia', name: 'La Concordia', capital: 'La Concordia', parishes: ['La Concordia','La Villegas','El Paraíso de Chontaduro'] },
    ]
  },
  {
    id: 'sucumbios', name: 'Sucumbíos', region: 'Amazonía', capital: 'Nueva Loja',
    cantons: [
      { id: 'lago_agrio', name: 'Lago Agrio', capital: 'Nueva Loja', parishes: ['Nueva Loja','Dureno','El Eno','General Farfán','Pacayacu','Santa Cecilia','Tetete','Cascales'] },
      { id: 'cascales', name: 'Cascales', capital: 'El Dorado de Cascales', parishes: ['El Dorado de Cascales','Sevilla','Santa Rosa de Sucumbíos'] },
      { id: 'cuyabeno', name: 'Cuyabeno', capital: 'Tarapoa', parishes: ['Tarapoa','Aguas Negras','Cuyabeno','Sansahuari'] },
      { id: 'gonzalo_pizarro', name: 'Gonzalo Pizarro', capital: 'Lumbaquí', parishes: ['Lumbaquí','El Reventador','Gonzalo Pizarro','Puerto Libre'] },
      { id: 'putumayo', name: 'Putumayo', capital: 'Puerto El Carmen del Putumayo', parishes: ['Puerto El Carmen del Putumayo','Palma Roja','Puerto Bolívar','Rosa Florida','San Pedro de los Cofanes','Tetete'] },
      { id: 'shushufindi', name: 'Shushufindi', capital: 'Shushufindi', parishes: ['Shushufindi','Limoncocha','Pañacocha','San Roque','San Pedro de los Cofanes','Siete de Julio'] },
      { id: 'sucumbios', name: 'Sucumbíos', capital: 'La Bonita', parishes: ['La Bonita','El Playón de San Francisco','La Sofía','Rosa Florida','Santa Bárbara'] },
      { id: 'nueva_loja', name: 'Nueva Loja', capital: 'Lago Agrio', parishes: ['Lago Agrio'] },
    ]
  },
  {
    id: 'tungurahua', name: 'Tungurahua', region: 'Sierra', capital: 'Ambato',
    cantons: [
      { id: 'ambato', name: 'Ambato', capital: 'Ambato', parishes: ['Ambato','Ambatillo','Atahualpa','Augusto N. Martínez','Constantino Fernández','Huachi Grande','Izamba','Juan B. Vela','Montalvo','Pasa','Picaigua','Pilagua','Quisapincha','San Bartolomé de Pinllo','San Fernando','Santa Rosa','Totoras','Cunchibamba','Unamuncho'] },
      { id: 'banos', name: 'Baños de Agua Santa', capital: 'Baños', parishes: ['Baños','Lligua','Río Negro','Río Verde','Ulba'] },
      { id: 'cevallos', name: 'Cevallos', capital: 'Cevallos', parishes: ['Cevallos'] },
      { id: 'mocha', name: 'Mocha', capital: 'Mocha', parishes: ['Mocha','Pinguilí'] },
      { id: 'patate', name: 'Patate', capital: 'Patate', parishes: ['Patate','El Triunfo','Los Andes','Sucre'] },
      { id: 'quero', name: 'Quero', capital: 'Quero', parishes: ['Quero','Rumipamba','La Matriz','Yanayacu'] },
      { id: 'san_pedro_de_pelileo', name: 'San Pedro de Pelileo', capital: 'Pelileo', parishes: ['Pelileo','Benítez','Bolívar','Cotaló','Chiquicha','El Rosario','García Moreno','Guambaló','Huambalo','Salasaca'] },
      { id: 'santiago_de_pillaro', name: 'Santiago de Píllaro', capital: 'Píllaro', parishes: ['Píllaro','Ciudad Nueva','Emilio María Terán','Marcos Espinel','Presidente Urbina','San Andrés','San José de Poaló','San Miguelito'] },
      { id: 'tisaleo', name: 'Tisaleo', capital: 'Tisaleo', parishes: ['Tisaleo','Quinchicoto'] },
    ]
  },
  {
    id: 'zamora_chinchipe', name: 'Zamora Chinchipe', region: 'Amazonía', capital: 'Zamora',
    cantons: [
      { id: 'zamora', name: 'Zamora', capital: 'Zamora', parishes: ['Zamora','Cumbaratza','Guadalupe','Timbara','San Carlos de las Minas','La Paz','Imbana','Sabanilla'] },
      { id: 'chinchipe', name: 'Chinchipe', capital: 'Zumba', parishes: ['Zumba','Chito','El Chorro','El Porvenir del Carmen','La Chonta','Palanda','San Andrés','Pucapamba'] },
      { id: 'nangaritza', name: 'Nangaritza', capital: 'Guayzimi', parishes: ['Guayzimi','Los Encuentros','Nuevo Paraíso'] },
      { id: 'yacuambi', name: 'Yacuambi', capital: 'El Pangui', parishes: ['El Pangui','Chicaña','Tutupali','El Guismi'] },
      { id: 'yantzaza', name: 'Yantzaza', capital: 'Yantzaza', parishes: ['Yantzaza','Chicaña','Los Encuentros'] },
      { id: 'el_pangui', name: 'El Pangui', capital: 'El Pangui', parishes: ['El Pangui','El Guismi','Pachicutza','Tundayme'] },
      { id: 'centinela_del_condor', name: 'Centinela del Cóndor', capital: 'Zumbi', parishes: ['Zumbi','Paquisha','Panguintza'] },
      { id: 'paquisha', name: 'Paquisha', capital: 'Paquisha', parishes: ['Paquisha','Bellavista','Nuevo Quito'] },
      { id: 'palanda', name: 'Palanda', capital: 'Palanda', parishes: ['Palanda','El Porvenir del Carmen','San Francisco de Vergel','Valladolid'] },
    ]
  },
];
