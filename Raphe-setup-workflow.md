## Raphe company setup workflow:

To begin with, I would like to provide better clarity on our use case. We are a UAV research and manufacturing company, and every drone in our fleet is equipped with EO/IR cameras that continuously collect imagery during missions.

At present, we are generating 2D and 3D maps using WebODM and Pix4D pipelines. While these tools serve the purpose, they come with certain limitations that restrict our ability to scale and optimize our workflows.

We would like to understand in detail what your solution offers for 2D/3D map generation using camera‑based imagery (without LiDAR). Specifically, we are interested in knowing how your approach improve reconstruction quality, processing speed, automation, or integration with our UAV systems.

Looking forward to your insights.



## potential changes to be done in order to implement the whole workflow:

1. for the given tile being fetched for copc rendering ( across paris, bordeaux and other projects from LidarHD). i need to further enhance it with the following reconstruction pipelines:
- doing the reconstruction using the webODM lightening along with the drone images: 
  - for ex: take the following drone footage taking the shot of the given chateleh les halles + other area from the 1st arrondisement: https://www.youtube.com/watch?v=jRbCWEz8uhU
  - Corresponding google earth image dataset: https://earth.google.com/web/@48.86254453,2.34498962,34.44363088a,328.07871034d,35y,45.30012309h,59.99745464t,0r/data=CgRCAggBOgMKATBCAggASg0I____________ARAA

  - and open source footage from the given area (e,g youtube area): https://www.youtube.com/watch?v=jRbCWEz8uhU

i need you to do the detailed research on the above dataset and then provide me with the better alterantives such that: 
  - we will be able to compare the performance of the Pix4d + webODM reconstruction pipeline in order to implement the restructuring subsequent surfaces on the LidarHD with that of the watertight reconstruction + gaussian splatting + photogrammetric dataset that makes the deployment of the whole pipeline shown in the map with the choice selections for each reconstruction layer ( from youtube videos + 3d reconstruction).



## software stack to consider:

1. webodm
2. nerfstudio: gsplat 
3. litchfield 
4. other tools ( both open and closed source ) provided here: 


## also searching from gemini , i got the following resource regardinng the scrapping the 3d reconstruction splats fromm google earth:


Method 2: The Unofficial Way (Graphics Injection)For background context, 3D printing concepts, or animation modeling, the community relies on capturing the GPU draw-calls while Google Maps runs in a browser.The RenderDoc + Blender PipelineThe most famous methodology intercepts the raw geometry buffered by your graphics card:Required Software: Download RenderDoc (a graphics debugger) and Blender.The Importer Plugin: Install the open-source Maps Models Importer plugin into Blender.GPU Hooking: Launch Google Chrome or Microsoft Edge through RenderDoc using a custom command-line flag shortcut (--disable-gpu-sandbox --gpu-startup-dialog) to open a direct diagnostic backchannel into the browser's rendering engine.Capturing: Navigate to the location on Google Maps in full 3D mode, pan around so the high-resolution assets load, and trigger a Frame Capture inside RenderDoc.Importing: Save the output .rdc capture file, open Blender, and use the plugin to convert the data back into an editable 3D mesh complete with its original texturing.Alternative Map ExtractorsTools like BlenderGIS or specialized third-party offline photogrammetry software allow users to manually drag selection boundaries over geographic grids to automatically parse bounding coordinates into low-density polygon grids.⚠️ Legal and Practical DrawbacksStrictly Non-Commercial: Reconstructing 3D meshes from Google Earth images for external redistribution, game development assets, or commercial use directly violates Google Earth Permission Guidelines.Messy Geometry: Scraped data via GPU interception is notoriously jagged, heavy on polygon counts, and requires hours of optimization (re-topologizing, removing overlapping vertex doubles, and merging texturing sheets).


## for comparison

Pix4d: https://www.pix4d.com/product/pix4dmatic-large-scale-photogrammetry-software/ and https://www.pix4d.com/product/pix4dcloud/