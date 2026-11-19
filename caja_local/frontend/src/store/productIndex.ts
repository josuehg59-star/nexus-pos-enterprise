import { db, type Product } from './database';

export interface IndexedItem {
  product: Product;
  skuLower: string;
  nameLower: string;
  categoryLower: string;
  barcodes: string[];
  searchStr: string;
}

class ProductSearchIndex {
  private products: Product[] = [];
  private barcodeMap: Map<string, Product> = new Map();
  private idMap: Map<number, Product> = new Map();
  private searchItems: IndexedItem[] = [];
  private isLoaded = false;
  private loadPromise: Promise<void> | null = null;
  private debounceRebuildTimer: any = null;

  constructor() {
    this.setupDexieHooks();
  }

  private setupDexieHooks() {
    // Escuchar automáticamente cualquier creación, actualización o borrado en Dexie
    try {
      db.products.hook('creating', () => {
        this.scheduleRebuild();
      });
      db.products.hook('updating', () => {
        this.scheduleRebuild();
      });
      db.products.hook('deleting', () => {
        this.scheduleRebuild();
      });
    } catch (e) {
      console.warn('[ProductIndex] No se pudieron registrar hooks automáticos en Dexie:', e);
    }
  }

  private scheduleRebuild() {
    if (this.debounceRebuildTimer) clearTimeout(this.debounceRebuildTimer);
    this.debounceRebuildTimer = setTimeout(() => {
      this.rebuildIndex().catch(console.warn);
    }, 150);
  }

  public async init(): Promise<void> {
    if (this.isLoaded) return;
    if (this.loadPromise) return this.loadPromise;

    this.loadPromise = this.rebuildIndex();
    await this.loadPromise;
  }

  public async rebuildIndex(): Promise<void> {
    try {
      const allProducts = await db.products.toArray();
      this.products = allProducts;
      this.barcodeMap.clear();
      this.idMap.clear();
      this.searchItems = [];

      for (const prod of allProducts) {
        if (prod.id) {
          this.idMap.set(prod.id, prod);
        }

        const sku = String(prod.sku || '').trim().toLowerCase();
        const name = String(prod.name || '').trim().toLowerCase();
        const desc = String((prod as any).description || '').trim().toLowerCase();
        const cat = String((prod as any).category || '').trim().toLowerCase();
        const family = String((prod as any).family || '').trim().toLowerCase();
        const prov = String((prod as any).proveedor || (prod as any).supplier || (prod as any).supplier_name || '').trim().toLowerCase();

        const barcodes: string[] = [];
        if (sku) barcodes.push(sku);

        const extractCodes = (rawVal: any) => {
          if (!rawVal) return;
          const str = String(rawVal);
          // Separar por coma, tubería (|), punto y coma o espacio
          const parts = str.split(/[,|;\s]+/).map(s => s.trim().toLowerCase()).filter(Boolean);
          for (const p of parts) {
            if (!barcodes.includes(p)) barcodes.push(p);
          }
        };

        extractCodes(prod.barcode2);
        extractCodes(prod.barcode3);

        // Mapear cada código al producto para búsqueda O(1) instantánea
        for (const code of barcodes) {
          this.barcodeMap.set(code, prod);
        }

        const searchStr = `${name} ${sku} ${barcodes.join(' ')} ${desc} ${cat} ${family} ${prov}`;

        this.searchItems.push({
          product: prod,
          skuLower: sku,
          nameLower: name,
          categoryLower: cat,
          barcodes,
          searchStr,
        });
      }

      this.isLoaded = true;
    } catch (e) {
      console.error('[ProductIndex] Error construyendo índice en memoria:', e);
    }
  }

  /**
   * Búsqueda O(1) ultra instantánea por código de barras o SKU exacto
   */
  public findByBarcode(rawCode: string): Product | undefined {
    if (!rawCode) return undefined;
    const code = rawCode.trim().toLowerCase();
    return this.barcodeMap.get(code);
  }

  /**
   * Búsqueda O(1) por ID
   */
  public findById(id: number): Product | undefined {
    return this.idMap.get(id);
  }

  /**
   * Actualización instantánea de stock en memoria tras una venta
   */
  public updateStockInCache(productId: number, newStock: number) {
    const prod = this.idMap.get(productId);
    if (prod) {
      prod.stock = newStock;
    }
  }

  /**
   * Búsqueda en memoria hiperveloz (< 0.5ms) con soporte para:
   * - Códigos de barras (exacto, prefijo, sufijo)
   * - Múltiples palabras en cualquier orden (ej. "coca 2.5")
   * - Relevancia ponderada y stock visible
   */
  public search(query: string, maxResults = 15): Product[] {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    // Si aún no ha cargado, retornar vacío mientras carga en segundo plano
    if (!this.isLoaded && this.searchItems.length === 0) {
      this.init().catch(console.warn);
      return [];
    }

    const exactMatch = this.barcodeMap.get(q);
    const terms = q.split(/\s+/).filter(t => t.length > 0);

    const scored: { prod: Product; score: number }[] = [];

    for (let i = 0; i < this.searchItems.length; i++) {
      const item = this.searchItems[i];
      let score = 0;

      // Coincidencia exacta de código
      if (item.barcodes.includes(q) || item.skuLower === q) {
        score = 10000;
      } else {
        // Código empieza con o contiene la consulta
        let codeMatched = false;
        for (const b of item.barcodes) {
          if (b.startsWith(q)) {
            score = Math.max(score, 1200);
            codeMatched = true;
            break;
          } else if (b.includes(q)) {
            score = Math.max(score, 800);
            codeMatched = true;
            break;
          }
        }

        // Búsqueda por texto (nombre, categoría, descripción, proveedor)
        if (item.nameLower.startsWith(q)) {
          score = Math.max(score, 600);
        } else if (item.nameLower.includes(q)) {
          score = Math.max(score, 450);
        } else if (item.searchStr.includes(q)) {
          // Coincide en descripción, categoría, familia o proveedor
          score = Math.max(score, 350);
        }

        // Multibúsqueda por palabras (ej. "lala 1l deslactosada", "coca 2.5 retornable")
        if (terms.length > 1 && terms.every(t => item.searchStr.includes(t))) {
          // Si todas las palabras están en el nombre, máxima prioridad de texto
          if (terms.every(t => item.nameLower.includes(t))) {
            score = Math.max(score, 500);
          } else {
            // Coincide combinando nombre + descripción + categoría + etc.
            score = Math.max(score, 400);
          }
        }

        // Categoría exacta
        if (item.categoryLower === q) {
          score = Math.max(score, 200);
        }
      }

      if (score > 0) {
        scored.push({ prod: item.product, score });
      }
    }

    // Ordenar: mayor puntaje primero, luego alfabético
    scored.sort((a, b) => b.score - a.score || a.prod.name.localeCompare(b.prod.name));

    // Si hubo coincidencia exacta de código, asegurar que encabece la lista
    if (exactMatch && (!scored[0] || scored[0].prod.id !== exactMatch.id)) {
      return [exactMatch, ...scored.filter(s => s.prod.id !== exactMatch.id).slice(0, maxResults - 1).map(s => s.prod)];
    }

    return scored.slice(0, maxResults).map(s => s.prod);
  }

  public getAll(): Product[] {
    return this.products;
  }
}

export const productIndex = new ProductSearchIndex();
