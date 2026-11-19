import os

with open('src/pages/Inventory.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

func = """
  const handleSaveProduct = async () => {
    if (!name || !price) {
      alert('Nombre y Precio son obligatorios');
      return;
    }
    
    setIsSubmitting(true);
    try {
      if (_editId) {
        await db.products.update(_editId, {
          sku: sku || String(Date.now()),
          name: name.toUpperCase(),
          cost: parseFloat(cost) || 0,
          price: parseFloat(price) || 0,
          stock: parseFloat(stock) || 0,
          category: category
        });
      } else {
        await db.products.add({
          sku: sku || String(Date.now()),
          name: name.toUpperCase(),
          cost: parseFloat(cost) || 0,
          price: parseFloat(price) || 0,
          stock: parseFloat(stock) || 0,
          category: category,
          status: 'ACTIVO'
        });
      }
      setShowAddModal(false);
      setEditId(null);
      setSku('');
      setName('');
      setCost('');
      setPrice('');
      setStock('');
    } catch (err) {
      alert('Error guardando el producto');
      console.error(err);
    }
    setIsSubmitting(false);
  };
"""

c = c.replace("const handleDelete =", func + "\n    const handleDelete =")

with open('src/pages/Inventory.tsx', 'w', encoding='utf-8') as f:
    f.write(c)

print("handleSaveProduct restored")
