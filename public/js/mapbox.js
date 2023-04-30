export const displayMap = (locations) =>{
    mapboxgl.accessToken = 'pk.eyJ1Ijoia2hhbGlkemFpYiIsImEiOiJjbGE0eW81cWwwMnU4M3BsZzhhb2lzazYwIn0.1luLnerSE8HQNccbiEBKRg';
    var map = new mapboxgl.Map({
      container: 'map',
      style: 'mapbox://styles/khalidzaib/cla5cxgdb000g15nw6fxl3ig5',
      scrollZoom:false
    //   center:[-118.312901,34.023576],
    //   zoom:10,
    //   interactive:false
    });
    
    const bounds = new mapboxgl.LngLatBounds();
    
    locations.forEach(loc =>{
        //create marker
        const el = document.createElement('div');
        el.className ='marker';
    
        //add marker
        new mapboxgl.Marker({
            element:el,
            anchor:'bottom'
        })
        .setLngLat(loc.coordinates)
        .addTo(map);
    
        //add popup title
        new mapboxgl.Popup({
            offset:30
        })
        .setLngLat(loc.coordinates)
        .setHTML(`<p>Day ${loc.day}: ${loc.description} </p>`)
        .addTo(map);
    
        //extend map bounds to iclude current locations
        bounds.extend(loc.coordinates);
    });
    
    map.fitBounds(bounds,{
        padding:{
            top:200,
            bottom:150,
            left:100,
            right:100
        }
    });
}