const db = require('../../../db')

//根据id获取sku列表
exports.getSkuListById = (req, res) => {
  let { page, limit } = req.params
  let { category1Id, category2Id, category3Id } = req.body
  if (page == 0) page = 1
  //先返回所有的记录数
  //count 函数 可以计算获取的条数
  const sql = 'select count(*) as total from spu where  category1Id=? and category2Id=? and category3Id=?'
  db.query(sql, [category1Id, category2Id, category3Id], (err, results) => {
    if (err) return res.cc(err)
    if (results == null) return res.cc('无记录')
    //results[0]代表的就是total 总共条数
    const total = results[0]['total']
    //3.查询记录
    //limit x,x ：  limit 3，5 表示从第三条数据开始往后面获取五条数据  4，5，6，7，8
    //所以先计算出起始位置
    page = (page - 1) * limit
    const sqlA = `select * from spu where  category1Id=? and category2Id=? and category3Id=? limit ${page},${limit}  `
    db.query(sqlA, [category1Id, category2Id, category3Id], (err, results1) => {
      if (err) return res.cc(err)
      //results1就是获取到的数据
      res.json({
        code: 200,
        message: '获取数据成功',
        data: {
          total,
          list: results1,
        },
      })
    })
  })
}
//添加spu
exports.add = async (req, res) => {
  //spu表需要的数据
  const { category1Id, category2Id, category3Id, spu_descript, spu_name, spu_tradeMark } = req.body
  //spu_sale表与spu_sale_list表需要的数据
  const { spuSaleList } = req.body
  //spu_img表需要的数据
  const { spuImageList } = req.body
  let totalSpu = ''
  let totalSale = ''
  //1.判断spu表是否有重复的数据
  const sqlA = `select * from spu where spu_name=?  and category1Id=? and category2Id=? and category3Id=?`
  try {
    let resultsA = await new Promise((resolve, reject) => {
      db.query(sqlA, [spu_name, category1Id, category2Id, category3Id], (err, results) => {
        if (err) reject(err)
        if (results.length !== 0) {
          resolve('该spu已存在')
        }
        resolve()
      })
    })
    if (resultsA) return res.cc(resultsA)
  } catch (error) {
    res.cc(error)
  }

  //2.判断spu表有多少条数据
  const sqlB = `select count(*) as total from spu`
  try {
    totalSpu = await new Promise((resolve, reject) => {
      db.query(sqlB, (err, results) => {
        if (err) reject(err)
        //results[0]代表的就是total 总共条数
        const total = results[0]['total']
        resolve(total)
      })
    })
  } catch (error) {
    res.cc(error)
  }

  //3.添加spu表数据
  const sqlC = `insert into spu set ?`
  try {
    let resultsC = await new Promise((resolve, reject) => {
      db.query(sqlC, { spu_sale_id: totalSpu + 1, spu_name, spu_descript, spu_tradeMark, category1Id, category2Id, category3Id, spu_img_id: totalSpu + 1 }, (err, resultsC) => {
        if (err) reject(err)
        if (resultsC.affectedRows != 1) resolve('添加spu表失败')
        resolve()
      })
    })
    if (resultsC) res.cc(resultsC)
  } catch (error) {
    res.cc(error)
  }

  //4.判断spu_sale表有多少数据
  const sqlD = `select count(*) as total from spu_sale`
  try {
    totalSale = await new Promise((resolve, reject) => {
      db.query(sqlD, (err, results) => {
        if (err) resolve(err)
        const total = results[0]['total']
        resolve(total)
      })
    })
  } catch (error) {
    res.cc(error)
  }

  //5.添加spu_sale表
  const sqlE = `insert into spu_sale set?`
  try {
    let resultsD = await new Promise((resolve, reject) => {
      for (let i = 0; i < spuSaleList.length; i++) {
        db.query(sqlE, { spu_sale_name: spuSaleList[i].spu_sale_name, spu_sale_id: totalSpu + 1, spu_sale_name_id: totalSale + i + 1 }, (err, resultsD) => {
          if (err) reject(err)
          if (resultsD.affectedRows != 1) resolve('添加spu_sale表失败')
          resolve()
        })
      }
    })
    if (resultsD) res.cc(resultsD)
  } catch (error) {
    res.cc(error)
  }

  //6.添加spu_sale_list表
  const sqlF = `insert into spu_sale_list set?`
  try {
    let resultsE = await new Promise((resolve, reject) => {
      for (let i = 0; i < spuSaleList.length; i++) {
        for (let j = 0; j < spuSaleList[i].spu_sale_Value_list.length; j++) {
          db.query(sqlF, { spu_sale_name_id: totalSale + i + 1, spu_sale_value: spuSaleList[i].spu_sale_Value_list[j].spu_sale_value }, (err, results) => {
            if (err) reject(err)
            if (results.affectedRows != 1) resolve('添加spu_sale_list表失败')
            resolve()
          })
        }
      }
    })
    if (resultsE) res.cc(resultsE)
  } catch (error) {
    res.cc(error)
  }
  //7.添加spu_img表
  const sqlG = `insert into spu_img set?`
  try {
    let resultsG = await new Promise((resolve, reject) => {
      spuImageList.forEach((item) => {
        db.query(sqlG, { spu_img_id: totalSpu + 1, spu_img_name: item.spu_img_name, spu_img_url: item.spu_img_url }, (err, results) => {
          if (err) reject(err)
          if (results.affectedRows != 1) resolve('添加spu_img表失败')
          resolve()
        })
      })
    })
    if (resultsG) res.cc(resultsG)
  } catch (error) {
    res.cc(error)
  }
  res.json({
    code: 200,
    message: '添加成功',
  })
}

//根据spu_img_id获取spu的图片列表
exports.getSpuImgListBySpuId = (req, res) => {
  const sql = `select * from spu_img where spu_img_id=?`
  db.query(sql, [req.params.spu_img_id], (err, results) => {
    if (err) return res.cc(err)
    if (results.length === 0) return res.cc('没有找到该spu的图片列表')
    res.json({
      code: 200,
      message: '获取成功',
      data: results,
    })
  })
}
//根据spu_sale_id获取spu的sale
exports.getSpuSaleListBySpuId = async (req, res) => {
  const sqlA = `select * from spu_sale where spu_sale_id=?`
  let attrList = []
  let attrValueList = []
  //先获取spu_sale表的数据
  try {
    attrList = await new Promise((resolve, reject) => {
      db.query(sqlA, [req.params.spu_sale_id], (err, results) => {
        if (err) reject(err)
        if (results.length === 0) {
          resolve('spu_sale表中无记录')
        }
        resolve(results)
      })
    })
    if (!attrList instanceof Array) return res.cc(attrList)
  } catch (error) {
    res.cc(error)
  }
  //2.将attrList添加一个数组attrValueList
  attrList.forEach((item) => {
    item.saleValueList = []
  })
  //3.获取spu_sale_list表的数据
  const sqlB = `select * from spu_sale_list`
  try {
    attrValueList = await new Promise((resolve, reject) => {
      db.query(sqlB, (err, results) => {
        if (err) reject(err)
        resolve(results)
      })
    })
  } catch (error) {
    res.cc(error)
  }
  //4.设置一个方法将A数组的数据添加到B数组中
  function addValueList(arr1, arr2) {
    //将2的数组和1的数据进行合并
    for (let j = 0; j < arr1.length; j++) {
      for (let x = 0; x < arr2.length; x++)
        if (arr1[j].spu_sale_name_id == arr2[x].spu_sale_name_id) {
          arr1[j].saleValueList.push(arr2[x])
        }
    }
    return arr1
  }
  attrList = addValueList(attrList, attrValueList)

  res.json({
    code: 200,
    message: '获取数据成功',
    data: attrList,
  })
}

//添加sku
exports.addSku = async (req, res) => {
  //1.解构出数据
  const { spu_id, sku_name, sku_price, sku_weight, sku_descript, spu_tradeMark } = req.body
  //sku_img表需要的数据
  const { sku_img } = req.body
  //sku_sale表需要的数据
  const { sku_sale } = req.body
  //sku_attr表需要的数据
  const { sku_attr } = req.body
  //sku的数据条数
  let totalSku = 0
  //sku_sale的数据条数
  let totalSale = 0

  //2.判断sku表有多少条数据
  const sqlB = `select count(*) as total from sku`
  try {
    totalSku = await new Promise((resolve, reject) => {
      db.query(sqlB, (err, results) => {
        if (err) reject(err)
        //results[0]代表的就是total 总共条数
        const total = results[0]['total']
        resolve(total)
      })
    })
  } catch (error) {
    res.cc(error)
  }

  //3.添加sku表数据
  const sqlC = `insert into sku set ?`
  try {
    console.log(totalSku instanceof Number)
    let resultsC = await new Promise((resolve, reject) => {
      db.query(
        sqlC,
        { sku_img_id: totalSku + 1, sku_attr_id: totalSku + 1, sku_sale_id: totalSku + 1, spu_id, sku_name, sku_price, sku_weight, sku_descript, sku_tradeMark: spu_tradeMark },
        (err, results) => {
          if (err) reject(err)
          if (results.affectedRows != 1) resolve('添加sku表失败')
          resolve()
        },
      )
    })
    if (resultsC) res.cc(resultsC)
  } catch (error) {
    res.cc(error)
  }

  //4.判断sku_sale表有多少数据
  const sqlD = `select count(*) as total from spu_sale`
  try {
    totalSale = await new Promise((resolve, reject) => {
      db.query(sqlD, (err, results) => {
        if (err) resolve(err)
        const total = results[0]['total']
        resolve(total)
      })
    })
  } catch (error) {
    res.cc(error)
  }

  //5.添加spu_sale表
  const sqlE = `insert into sku_sale set?`
  try {
    let resultsD = await new Promise((resolve, reject) => {
      for (let i = 0; i < sku_sale.length; i++) {
        db.query(sqlE, { sku_sale_name: sku_sale[i].spu_sale_name, sku_sale_value: sku_sale[i].spu_sale_value, sku_sale_id: totalSku + 1 }, (err, resultsD) => {
          if (err) reject(err)
          if (resultsD.affectedRows != 1) resolve('添加sku_sale表失败')
          resolve()
        })
      }
    })
    if (resultsD) res.cc(resultsD)
  } catch (error) {
    res.cc(error)
  }

  //6.添加sku_img表
  const sqlG = `insert into sku_img set?`
  try {
    let resultsG = await new Promise((resolve, reject) => {
      sku_img.forEach((item) => {
        db.query(sqlG, { isDefault: item.isDefault, sku_img_id: totalSku + 1, sku_img_name: item.sku_img_name, sku_img_url: item.sku_img_url }, (err, results) => {
          if (err) reject(err)
          if (results.affectedRows != 1) resolve('添加sku_img表失败')
          resolve()
        })
      })
    })
    if (resultsG) res.cc(resultsG)
  } catch (error) {
    res.cc(error)
  }
    //7.添加sku_attr表
    const sqlH = `insert into sku_attr set?`
    try {
      let resultsD = await new Promise((resolve, reject) => {
        for (let i = 0; i < sku_attr.length; i++) {
          db.query(sqlH, { sku_attr_name: sku_attr[i].attr_name, sku_attr_value: sku_attr[i].valueName, sku_attr_id: totalSku + 1 }, (err, resultsD) => {
            if (err) reject(err)
            if (resultsD.affectedRows != 1) resolve('添加sku_attr表失败')
            resolve()
          })
        }
      })
      if (resultsD) res.cc(resultsD)
    } catch (error) {
      res.cc(error)
    }
    res.json({
      code: 200,
      message: '添加sku成功',
    })

}

//修改sku
exports.updateSku = (req,res)=>{
res.send('ok')  
}