"""Renders a studio preview of the ring so the model can be judged before shipping.

    python tools/blender/render_preview.py out.png [cut] [prongs|bezel] [pave|plain] [yellow|white|rose]
"""
import math
import os
import sys

import bpy
from mathutils import Vector

sys.path.insert(0, os.path.dirname(__file__))
import build_ring as br  # noqa: E402

METALS = {
    'yellow': (1.0, 0.78, 0.36),
    'white': (0.90, 0.89, 0.87),
    'rose': (0.95, 0.60, 0.50),
}


def area_light(name, loc, size_x, size_y, energy, target=Vector((0, 0, 0.2))):
    ld = bpy.data.lights.new(name, 'AREA')
    ld.shape = 'RECTANGLE'
    ld.size, ld.size_y, ld.energy = size_x, size_y, energy
    ob = bpy.data.objects.new(name, ld)
    bpy.context.scene.collection.objects.link(ob)
    ob.location = loc
    ob.rotation_euler = (target - Vector(loc)).to_track_quat('-Z', 'Y').to_euler()


def main():
    out = sys.argv[1]
    cut = sys.argv[2] if len(sys.argv) > 2 else 'round'
    setting = sys.argv[3] if len(sys.argv) > 3 else 'prongs'
    band = sys.argv[4] if len(sys.argv) > 4 else 'pave'
    metal = sys.argv[5] if len(sys.argv) > 5 else 'yellow'

    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    objs = br.build(scene.collection)

    for name, ob in objs.items():
        visible = (
            name in ('band', 'head')
            or name == f'stone_{cut}'
            or name == f'{setting}_{cut}'
            or (name == 'pave' and band == 'pave')
        )
        ob.hide_render = not visible
        ob.hide_viewport = not visible
    objs['band'].data.materials[0].node_tree.nodes['Principled BSDF'].inputs[
        'Base Color'].default_value = (*METALS[metal], 1)

    # Floor
    bpy.ops.mesh.primitive_plane_add(size=40, location=(0, 0, -br.R_TOP - 0.001))
    floor = bpy.context.object
    fm = bpy.data.materials.new('FLOOR')
    fm.use_nodes = True
    fb = fm.node_tree.nodes['Principled BSDF']
    fb.inputs['Base Color'].default_value = (0.62, 0.62, 0.62, 1)
    fb.inputs['Roughness'].default_value = 0.35
    floor.data.materials.append(fm)

    # World: light studio grey so the backdrop reads like the reference
    world = bpy.data.worlds.new('W')
    world.use_nodes = True
    bg = world.node_tree.nodes['Background']
    bg.inputs['Color'].default_value = (0.80, 0.80, 0.80, 1)
    bg.inputs['Strength'].default_value = 0.35
    scene.world = world

    # Softboxes: long strips give the band its signature reflections
    area_light('top', (0, -0.8, 3.4), 3.2, 3.2, 260)
    area_light('left', (-3.2, -1.5, 0.8), 0.7, 3.5, 170)
    area_light('right', (3.2, -2.0, 1.2), 0.7, 3.5, 170)
    area_light('front', (0.4, -4.5, 1.0), 3.0, 1.2, 60)

    cam_data = bpy.data.cameras.new('cam')
    cam_data.lens = 85
    cam = bpy.data.objects.new('cam', cam_data)
    scene.collection.objects.link(cam)
    cam.location = (2.6, -6.6, 2.3)
    cam.rotation_euler = (Vector((0, 0, 0.28)) - cam.location).to_track_quat('-Z', 'Y').to_euler()
    scene.camera = cam

    scene.render.engine = 'CYCLES'
    scene.cycles.device = 'CPU'
    scene.cycles.samples = int(os.environ.get('SAMPLES', 64))
    scene.cycles.use_denoising = True
    scene.cycles.max_bounces = 14
    scene.cycles.transmission_bounces = 12
    scene.cycles.caustics_reflective = False
    scene.cycles.caustics_refractive = False
    scene.cycles.sample_clamp_indirect = 8
    scene.render.resolution_x = int(os.environ.get('RES_X', 1100))
    scene.render.resolution_y = int(os.environ.get('RES_Y', 900))
    scene.view_settings.view_transform = 'Standard'
    scene.render.filepath = out
    bpy.ops.render.render(write_still=True)
    print('rendered', out)


main()
